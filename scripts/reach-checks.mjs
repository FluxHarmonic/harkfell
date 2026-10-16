#!/usr/bin/env node
// The exact 0.5 release scope. Independent processes share no search state.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha, attestBuild, verifyBuild, dependencyScopes, cacheDescriptor,
  cachedVerdict, storeVerdict } from './reach-cache.mjs';

export const legs = ['F-L', 'M-S', 'I-east', 'I-west', 'P-west-gap-east',
  'P-west-gap-west', 'P-east-gap-east', 'P-east-gap-west'];
export const ids = ['targets-2-4', 'targets-2-3-4', 'outside', ...legs.map(x => `timing-${x}`)];
const scope = '0.5: authored timing, outside without down/H5, target/entry only; full cell returns deferred';
const hash = value => createHash('sha256').update(value).digest('hex');
const clean = text => text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '');
const profiles = Array.from({ length: 16 }, (_, mask) => [2, 3, 4, 5].filter((_, i) => mask & (1 << i)));

export function inputs(root = '.') {
  const tracked = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'world', 'src', 'package.sgl',
    'sigil.lock', 'scripts/reach-checks.mjs', 'scripts/reach-cache.mjs', 'scripts/gate-cloudstair-targets.mjs'], { cwd: root })
    .toString().split('\0').filter(Boolean).sort();
  // The native reader also sees untracked/ignored authored world files. Match
  // its filename rules instead of trusting Git's view of the runtime world.
  const runtime = ['world/world.sgl'];
  function names(dir, suffix) {
    return fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir))
      .filter(name => !/^[.#]/.test(name) && name.endsWith(suffix)).map(name => `${dir}/${name}`) : [];
  }
  runtime.push(...names('world/regions', '.map'));
  if (fs.existsSync(path.join(root, 'world/rooms'))) {
    for (const region of fs.readdirSync(path.join(root, 'world/rooms'))) {
      if (fs.statSync(path.join(root, 'world/rooms', region)).isDirectory()) runtime.push(...names(`world/rooms/${region}`, '.room'));
    }
  }
  const files = [...new Set([...tracked, ...runtime.filter(file => fs.existsSync(path.join(root, file)))])].sort();
  const manifest = files.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]);
  return { digest: hash(JSON.stringify(manifest)), manifest };
}

// Keep every result and progress line. Only measured outside wall time and RSS
// are removed; search counters, maps, declarations and raw FAIL lines remain.
export function normalized(id, text) {
  const lines = clean(text).trimEnd().split('\n');
  if (id.startsWith('timing-')) {
    const name = id.slice(7);
    return lines.filter(line => line.startsWith(`(${name} carry `)).join('\n') + '\n';
  }
  return lines.map(line => line.replace(/, [0-9]+ s$/, ', <seconds> s')
    .replace(/\brss [0-9]+/g, 'rss <bytes>')).join('\n') + '\n';
}

export function verdict(id, code, text) {
  text = clean(text);
  if (/\(RED |Error \(|SETUP-FAILED|route check:/.test(text)) return false;
  if (id.startsWith('timing-')) {
    const name = id.slice(7);
    const rows = normalized(id, text).trimEnd().split('\n');
    const keys = profiles.flatMap(carry => ['#f', '#t'].map(down =>
      `(${name} carry (${carry.join(' ')}) down ${down} phases 480 `));
    return code === 0 && text.includes('PASS Cloudstair authored timing: 0 failures')
      && rows.length === 32 && keys.every(key => rows.filter(row => row.startsWith(key)).length === 1)
      && rows.every(row => / window-failures 0 survivors \d+ no-down-crossings 0 stranded \(\) required-return #[tf] unreachable-profile-return-misses \d+\)$/.test(row));
  }
  if (id === 'outside') {
    return code === 0 && text.split('\n').filter(line => line.startsWith('PASS room-check outside Cloudstair ')).length === 1
      && text.includes(': 107 rooms, parse seams map reach green')
      && !/^FAIL /m.test(text);
  }
  const carry = id.slice(8).replaceAll('-', ' ');
  const summaries = text.split('\n').filter(line => line.startsWith('(region carry '));
  return code === 2 && summaries.length === 1
    && summaries[0].startsWith(`(region carry (${carry}) down #t entry-phases 480 entry-failures 0 required-cells 525 unreached () traps 0 `)
    && / actual-landings \d+ complete #f\)$/.test(summaries[0])
    && text.includes('(drain-rounds-limit 0 not-a-gate-verdict)');
}

function command(id) {
  const base = ['--room-check'];
  if (id === 'outside') return [...base, '--outside-cloudstair'];
  if (id.startsWith('timing-')) return [...base, '--cloudstair-timing',
    ...(id === 'timing-all' ? [] : ['--timing-leg', id.slice(7)])];
  return [...base, '--cloudstair-region', '--carry', id.slice(8).replaceAll('-', ','),
    '--cell-returns', '--workers', '3'];
}

function environment(id) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith('HARKFELL_') || key.startsWith('SIGIL_GC_') || key.startsWith('SIGIL_YOUNG_')) delete env[key];
  }
  Object.assign(env, { SIGIL_YOUNG_THRESHOLD: '524288', SIGIL_YOUNG_THRESHOLD_MAX: '524288' });
  if (id !== 'outside') env.SIGIL_GC_HEAP_GROW_FACTOR = '1.3';
  if (id.startsWith('targets-')) Object.assign(env, {
    HARKFELL_REGION_DRAIN_ROUNDS: '0', HARKFELL_REGION_LANDING_BOUND: '1000000',
  });
  return env;
}

function policy(id) {
  const env = Object.fromEntries(Object.entries(environment(id)).filter(([key]) => /^(HARKFELL_|SIGIL_GC_|SIGIL_YOUNG_)/.test(key)));
  return { scope, args: command(id), environment: env };
}

export async function run({ out, jobs = 4, only = ids, serial = false,
  binary = './build/release/bin/harkfell', limit = 18000, cache,
  buildReceipt = 'build/release/reach-build.json' }) {
  if (!Number.isInteger(jobs) || jobs < 1 || jobs > 32) throw Error('jobs must be 1..32');
  if (!only.length || new Set(only).size !== only.length || only.some(id => !ids.includes(id))) throw Error('invalid or duplicate check selection');
  if (serial && only.length !== ids.length) throw Error('serial requires the complete scope');
  if (serial && cache) throw Error('serial reference must not use cached verdicts');
  const start = Date.now();
  fs.mkdirSync(out, { recursive: false }); // Never mix a retry with older evidence.
  const source = inputs();
  const binaryHash = hash(fs.readFileSync(binary));
  const head = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
  let cacheInfo;
  if (cache) {
    verifyBuild(source, binary, buildReceipt);
    const log = 'preflight.log';
    const fd = fs.openSync(path.join(out, log), 'wx');
    const code = await new Promise((resolve, reject) => {
      const child = spawn('timeout', ['--kill-after=10', '120', binary, '--room-check', '--reach-cache-inputs'], {
        stdio: ['ignore', fd, fd], env: environment('outside'),
      });
      child.once('error', reject);
      child.once('close', resolve);
    }).finally(() => fs.closeSync(fd));
    const text = fs.readFileSync(path.join(out, log), 'utf8');
    if (code !== 0) throw Error(`fresh whole-world preflight failed: raw=${code}`);
    cacheInfo = { schema: 1, preflight: { log, code, logHash: hash(text), inputs: source.digest },
      dependencies: dependencyScopes(text, ids) };
  }
  const queue = serial ? ['timing-all', 'outside', 'targets-2-4', 'targets-2-3-4'] : [...only];
  const records = [];
  const children = new Set();
  let interrupted = false;
  const stop = () => {
    interrupted = true;
    // Each admitted child owns a fresh session, including its timeout/workers.
    for (const child of children) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  async function worker() {
    while (queue.length && !interrupted) {
      const id = queue.shift();
      const args = command(id);
      const log = `${id}.log`;
      const fd = fs.openSync(path.join(out, log), 'wx');
      const started = Date.now();
      const descriptor = cache && cacheDescriptor(id, source, cacheInfo.dependencies, binaryHash, policy(id));
      const cached = cache && cachedVerdict(cache, descriptor, verdict, normalized);
      if (cached?.hit) {
        fs.closeSync(fd);
        fs.writeFileSync(path.join(out, log), cached.text);
        const record = { ...cached.record, log, head, inputs: source.digest,
          cacheHit: true, cacheKey: cached.key, cacheInputs: descriptor,
          origin: { head: cached.record.head, inputs: cached.record.inputs, seconds: cached.record.seconds },
          seconds: (Date.now() - started) / 1000 };
        records.push(record);
        fs.writeFileSync(path.join(out, `${id}.json`), JSON.stringify(record, null, 2) + '\n');
        console.log(`HIT ${id} key=${cached.key}`);
        continue;
      }
      if (cache) console.log(`MISS ${id} ${cached.reason} key=${cached.key}`);
      console.log(`START ${id} ${new Date(started).toISOString()}`);
      const child = spawn('timeout', ['--kill-after=10', String(limit), binary, ...args], {
        stdio: ['ignore', fd, fd], detached: true, env: environment(id),
      });
      children.add(child);
      const result = await new Promise(resolve => {
        child.once('error', error => resolve({ code: null, error: error.message }));
        child.once('close', (code, signal) => resolve({ code, signal }));
      });
      children.delete(child);
      fs.closeSync(fd);
      const text = fs.readFileSync(path.join(out, log), 'utf8');
      const checkIds = id === 'timing-all' ? legs.map(name => `timing-${name}`) : [id];
      for (const checkId of checkIds) {
        const record = { id: checkId, ...result, passed: !interrupted && verdict(checkId, result.code, text),
          log, logHash: hash(text), resultHash: hash(normalized(checkId, text)), args,
          seconds: (Date.now() - started) / 1000, binaryHash, head, inputs: source.digest };
        if (cache) Object.assign(record, { cacheHit: false, cacheKey: cached.key, cacheInputs: descriptor });
        records.push(record);
        fs.writeFileSync(path.join(out, `${checkId}.json`), JSON.stringify(record, null, 2) + '\n');
        console.log(`${record.passed ? 'PASS' : 'FAIL'} ${checkId} raw=${result.code} wall=${record.seconds}s`);
      }
    }
  }
  try { await Promise.all(Array.from({ length: serial ? 1 : jobs }, worker)); }
  finally {
    process.removeListener('SIGTERM', stop);
    process.removeListener('SIGINT', stop);
  }
  const unchanged = inputs().digest === source.digest;
  if (cache && unchanged && !interrupted) {
    for (const record of records) {
      if (!record.cacheHit && record.passed) storeVerdict(cache, record.cacheInputs, record,
        fs.readFileSync(path.join(out, record.log), 'utf8'));
    }
  }
  const passed = !interrupted && unchanged && records.length === only.length && records.every(record => record.passed);
  const receipt = { scope, passed, complete: only.length === ids.length, unchanged,
    seconds: (Date.now() - start) / 1000, jobs: serial ? 1 : jobs, serial,
    inputs: source, binaryHash, head, cache: cacheInfo,
    records: records.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)) };
  fs.writeFileSync(path.join(out, 'run.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(`RESULT reach-checks ${passed ? 'PASS' : 'FAIL'} complete=${receipt.complete} wall=${receipt.seconds}s; ${scope}`);
  return receipt;
}

// Re-read raw logs and recompute assertions/hashes; a partial shard, truncated
// transfer, duplicate check or edited receipt can never become a green gate.
export function collect(dirs) {
  const records = new Map();
  let digest;
  for (const dir of dirs) {
    const receipt = JSON.parse(fs.readFileSync(path.join(dir, 'run.json')));
    if (!receipt.passed || !receipt.unchanged || receipt.scope !== scope
        || hash(JSON.stringify(receipt.inputs.manifest)) !== receipt.inputs.digest) throw Error(`invalid run: ${dir}`);
    digest ??= receipt.inputs.digest;
    if (digest !== receipt.inputs.digest) throw Error('different source inputs');
    let dependencies;
    if (receipt.cache) {
      const preflight = receipt.cache.preflight;
      if (preflight.log !== 'preflight.log' || preflight.code !== 0 || preflight.inputs !== digest) throw Error('invalid preflight');
      const text = fs.readFileSync(path.join(dir, preflight.log), 'utf8');
      if (hash(text) !== preflight.logHash) throw Error('corrupt preflight');
      dependencies = dependencyScopes(text, ids);
      if (JSON.stringify(dependencies) !== JSON.stringify(receipt.cache.dependencies)) throw Error('wrong dependency scopes');
    }
    for (const record of receipt.records) {
      if (!ids.includes(record.id) || records.has(record.id) || record.inputs !== digest) throw Error(`duplicate/invalid check: ${record.id}`);
      if (path.basename(record.log) !== record.log) throw Error('invalid log path');
      const text = fs.readFileSync(path.join(dir, record.log), 'utf8');
      const result = normalized(record.id, text);
      if (!record.passed || hash(text) !== record.logHash || hash(result) !== record.resultHash
          || !verdict(record.id, record.code, text)) throw Error(`invalid result: ${record.id}`);
      if (dependencies) {
        const descriptor = cacheDescriptor(record.id, receipt.inputs, dependencies, receipt.binaryHash, policy(record.id));
        if (sha(JSON.stringify(descriptor)) !== record.cacheKey
            || sha(JSON.stringify(record.cacheInputs)) !== record.cacheKey
            || record.binaryHash !== receipt.binaryHash
            || JSON.stringify(record.args) !== JSON.stringify(command(record.id))) throw Error(`wrong cache context: ${record.id}`);
      } else if (record.cacheHit || record.cacheKey) throw Error('cache evidence without fresh preflight');
      records.set(record.id, { ...record, result });
    }
  }
  if (records.size !== ids.length) throw Error(`incomplete: ${records.size}/${ids.length} checks`);
  return { scope, inputs: digest, passed: true, records: ids.map(id => records.get(id)) };
}

export function compare(left, right) {
  if (left.inputs !== right.inputs) throw Error('different source inputs');
  for (let i = 0; i < ids.length; i++) {
    const a = left.records[i], b = right.records[i];
    if (a.id !== b.id || a.code !== b.code || a.result !== b.result) throw Error(`DIFFER: ${ids[i]}`);
  }
  return `SAME: all ${ids.length} checks, 256 timing rows, complete outside and target/entry logs`;
}

async function main(args) {
  if (args[0] === '--record-build') {
    if (args.length !== 1) throw Error('usage: --record-build (immediately after a successful release build)');
    console.log(JSON.stringify(attestBuild(inputs(), './build/release/bin/harkfell')));
    return;
  }
  if (args[0] === '--collect') {
    const result = collect(args.slice(1));
    console.log(`PASS combined reach: ${result.records.length} checks; ${scope}`);
    return;
  }
  if (args[0] === '--compare') {
    if (args.length !== 3) throw Error('usage: --compare SERIAL-DIR PARALLEL-DIR');
    console.log(compare(collect([args[1]]), collect([args[2]])));
    return;
  }
  const options = { out: args.shift() };
  if (!options.out) throw Error('usage: reach-checks.mjs NEW-EVIDENCE-DIR [--jobs N] [--only IDS] [--cache DIR] [--serial]');
  while (args.length) {
    const option = args.shift();
    if (option === '--serial') options.serial = true;
    else if (option === '--jobs') options.jobs = Number(args.shift());
    else if (option === '--only') options.only = args.shift()?.split(',');
    else if (option === '--cache') {
      options.cache = args.shift();
      if (!options.cache || options.cache.startsWith('--')) throw Error('--cache requires a directory');
    }
    else throw Error(`unknown option: ${option}`);
  }
  const result = await run(options);
  if (!result.passed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(`FAIL reach-checks: ${error.message}`); process.exitCode = 1; });
}
