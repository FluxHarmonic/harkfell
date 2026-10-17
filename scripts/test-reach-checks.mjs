import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { run, collect, compare, legs, ids, verdict, normalized, inputs } from './reach-checks.mjs';
import { attestBuild, sha } from './reach-cache.mjs';

const row = (name, carry, down) => `(${name} carry (${carry.join(' ')}) down ${down} phases 480 window-failures 0 survivors 480 no-down-crossings 0 stranded () required-return #t unreachable-profile-return-misses 0)`;
const timing = name => Array.from({ length: 16 }, (_, mask) => [2, 3, 4, 5].filter((_, i) => mask & (1 << i)))
  .flatMap(carry => ['#f', '#t'].map(down => row(name, carry, down))).join('\n')
  + '\nPASS Cloudstair authored timing: 0 failures (regional/world reach NOT established)\n';

test('timing requires every distinct carry/down profile and successful exit', () => {
  const green = timing('F-L');
  assert.ok(verdict('timing-F-L', 0, green));
  for (const [code, text] of [[1, green], [124, green], [0, ''],
    [0, green.replace(/.*carry \(\) down #f.*\n/, '')],
    [0, green.replace('window-failures 0', 'window-failures 1')],
    [0, green.replace('stranded ()', 'stranded (42)')],
    [0, green.replace('no-down-crossings 0', 'no-down-crossings 1')],
    [0, green + green.split('\n')[0] + '\n']]) {
    assert.equal(verdict('timing-F-L', code, text), false);
  }
});

test('target-only incomplete scope is qualified and never accepts timeout/empty/wrong carry', () => {
  const text = '(drain-rounds-limit 0 not-a-gate-verdict)\n'
    + '(region carry (2 4) down #t entry-phases 480 entry-failures 0 required-cells 525 unreached () traps 0 actual-landings 13104 complete #f)\n';
  assert.ok(verdict('targets-2-4', 2, text));
  for (const [code, value] of [[0, text], [124, text], [2, ''], [2, text + text],
    [2, text.replace('traps 0', 'traps 1')], [2, text.replace('525', '524')],
    [2, text.replace('entry-failures 0', 'entry-failures 1')],
    [2, text.replace('complete #f', 'complete #t')], [2, text + '(RED cap)']]) {
    assert.equal(verdict('targets-2-4', code, value), false);
  }
  assert.equal(verdict('targets-2-3-4', 2, text), false);
});

test('normalization preserves assertion and search differences', () => {
  assert.equal(normalized('outside', 'reach 123, 12 s\n'), normalized('outside', 'reach 123, 15 s\n'));
  assert.notEqual(normalized('outside', 'reach 123, 12 s\n'), normalized('outside', 'reach 124, 12 s\n'));
});

test('bounded scheduler, monolithic serial comparison, distributed collection and fail-closed controls', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-checks-test-'));
  const binary = path.join(temp, 'checker');
  const events = path.join(temp, 'events');
  // This deterministic checker double exercises process scheduling and receipt
  // handling. Real physics/serial equivalence runs separately on the world.
  fs.writeFileSync(binary, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
fs.appendFileSync(${JSON.stringify(events)}, '+ ' + process.pid + '\\n');
setTimeout(() => {
  fs.appendFileSync(${JSON.stringify(events)}, '- ' + process.pid + '\\n');
  if (args.includes('--cloudstair-timing')) {
    const names = args.includes('--timing-leg') ? [value('--timing-leg')] : ${JSON.stringify(legs)};
    const rows = ${JSON.stringify(Object.fromEntries(legs.map(name => [name, timing(name).split('\n').slice(0, 32).join('\n')])))};
    for (const name of names) console.log(rows[name]);
    console.log('PASS Cloudstair authored timing: 0 failures');
  } else if (args.includes('--outside-cloudstair')) {
    console.log('PASS room-check outside Cloudstair [qualified scope]: 107 rooms, parse seams map reach green');
  } else {
    console.log('(drain-rounds-limit 0 not-a-gate-verdict)');
    console.log('(region carry (' + value('--carry').replaceAll(',', ' ') + ') down #t entry-phases 480 entry-failures 0 required-cells 525 unreached () traps 0 actual-landings 13104 complete #f)');
    process.exitCode = 2;
  }
}, 80);
`, { mode: 0o755 });
  try {
    const parallel = path.join(temp, 'parallel'), serial = path.join(temp, 'serial');
    assert.ok((await run({ out: parallel, binary, jobs: 3 })).passed);
    let active = 0, peak = 0;
    for (const event of fs.readFileSync(events, 'utf8').trim().split('\n')) {
      active += event[0] === '+' ? 1 : -1;
      peak = Math.max(peak, active);
    }
    assert.equal(active, 0);
    assert.equal(peak, 3);
    assert.ok((await run({ out: serial, binary, serial: true })).passed);
    const a = collect([serial]), b = collect([parallel]);
    assert.deepEqual(a.records.find(record => record.id === 'outside').args,
      ['--room-check', '--outside-cloudstair', '--workers', '0']);
    assert.deepEqual(b.records.find(record => record.id === 'outside').args,
      ['--room-check', '--outside-cloudstair', '--workers', '8']);
    const receiptPath = path.join(parallel, 'run.json');
    const originalReceipt = fs.readFileSync(receiptPath, 'utf8');
    const wrongPolicy = JSON.parse(originalReceipt);
    wrongPolicy.outsideWorkers = 7;
    fs.writeFileSync(receiptPath, JSON.stringify(wrongPolicy));
    assert.throws(() => collect([parallel]), /wrong check arguments/);
    fs.writeFileSync(receiptPath, originalReceipt);
    assert.match(compare(a, b), /^SAME:/);
    await t.test('collection rejects internally consistent evidence from another checkout', () => {
      const stale = JSON.parse(originalReceipt);
      stale.inputs.manifest[0][1] = '0'.repeat(64);
      stale.inputs.digest = sha(JSON.stringify(stale.inputs.manifest));
      for (const record of stale.records) record.inputs = stale.inputs.digest;
      fs.writeFileSync(receiptPath, JSON.stringify(stale));
      try { assert.throws(() => collect([parallel]), /running checkout/); }
      finally { fs.writeFileSync(receiptPath, originalReceipt); }
    });
    await t.test('collection rejects a record from a different executable', () => {
      const mixed = JSON.parse(originalReceipt);
      mixed.records[0].binaryHash = '0'.repeat(64);
      fs.writeFileSync(receiptPath, JSON.stringify(mixed));
      try { assert.throws(() => collect([parallel]), /checker binar/); }
      finally { fs.writeFileSync(receiptPath, originalReceipt); }
    });
    const changed = structuredClone(b);
    changed.records[0].result += 'PLANTED DIFFERENCE\n';
    assert.throws(() => compare(a, changed), /DIFFER/);
    assert.throws(() => collect([serial, parallel]), /duplicate/);
    const partial = path.join(temp, 'partial');
    await run({ out: partial, binary, only: [ids[0]] });
    assert.throws(() => collect([partial]), /incomplete/);
    const remaining = path.join(temp, 'remaining');
    await run({ out: remaining, binary, only: ids.slice(1) });
    assert.match(compare(a, collect([partial, remaining])), /^SAME:/);
    await t.test('collection rejects mixed executable hashes across complete shards', () => {
      const file = path.join(remaining, 'run.json');
      const original = fs.readFileSync(file, 'utf8');
      const mixed = JSON.parse(original);
      mixed.binaryHash = '0'.repeat(64);
      for (const record of mixed.records) record.binaryHash = mixed.binaryHash;
      fs.writeFileSync(file, JSON.stringify(mixed));
      try { assert.throws(() => collect([partial, remaining]), /different checker binaries/); }
      finally { fs.writeFileSync(file, original); }
    });
    const log = path.join(parallel, 'outside.log');
    fs.appendFileSync(log, 'FAIL planted corruption\n');
    assert.throws(() => collect([parallel]), /invalid result/);
    await assert.rejects(run({ out: parallel, binary }), /EEXIST/);
    await assert.rejects(run({ out: path.join(temp, 'empty'), binary, only: [] }), /invalid/);
    await assert.rejects(run({ out: path.join(temp, 'workers'), binary, outsideWorkers: 11 }), /outside workers/);
    const missing = await run({ out: path.join(temp, 'missing'), binary: '/missing-checker', only: ['outside'] }).catch(() => null);
    assert.equal(missing?.passed ?? false, false);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('stale native executables are refused before any mode executes or attests them', async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-stale-test-'));
  const binary = path.join(temp, 'checker');
  const marker = path.join(temp, 'executed');
  const buildReceipt = path.join(temp, 'build.json');
  fs.writeFileSync(binary, `#!/bin/sh
echo entered >> '${marker}'
echo 'PASS room-check outside Cloudstair: 107 rooms, parse seams map reach green'
`, { mode: 0o755 });
  try {
    const source = inputs();
    attestBuild(source, binary, buildReceipt);
    fs.utimesSync(binary, new Date(0), new Date(0));
    for (const [name, options] of [
      ['parallel', { only: ['outside'], jobs: 3 }],
      ['serial', { serial: true }],
      ['cache', { only: ['outside'], cache: path.join(temp, 'cache') }],
    ]) {
      await t.test(`stale binary cannot run in ${name} mode`, async () => {
        await assert.rejects(run({ out: path.join(temp, name), binary, buildReceipt, ...options }), /stale checker build/);
        assert.equal(fs.existsSync(marker), false, 'the stale binary was executed');
      });
      fs.rmSync(marker, { force: true });
    }
    await t.test('stale binary cannot be bound to current source by attestBuild', () => {
      assert.throws(() => attestBuild(source, binary, path.join(temp, 'stale-build.json')), /stale checker build/);
      assert.equal(fs.existsSync(path.join(temp, 'stale-build.json')), false);
    });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('a repeated interrupt reaps only admitted detached checkers', { timeout: 15000 }, async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-interrupt-test-'));
  const binary = path.join(temp, 'checker');
  const marker = path.join(temp, 'pid');
  const out = path.join(temp, 'receipt');
  fs.writeFileSync(binary, `#!/usr/bin/env node
const fs = require('node:fs');
process.on('SIGTERM', () => fs.appendFileSync(${JSON.stringify(marker)}, '\\nterm'));
fs.writeFileSync(${JSON.stringify(marker)}, String(process.pid));
setInterval(() => {}, 100);
`, { mode: 0o755 });
  const module = pathToFileURL(path.resolve('scripts/reach-checks.mjs')).href;
  const code = `import { run } from ${JSON.stringify(module)};
const result = await run(${JSON.stringify({ out, binary, only: ['outside'], limit: 10 })});
process.exitCode = result.passed ? 0 : 1;`;
  const runner = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: 'ignore' });
  const exit = new Promise(resolve => runner.once('exit', (code, signal) => resolve({ code, signal })));
  const waitFor = async predicate => {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
      assert.ok(Date.now() < deadline, 'interrupt control timed out');
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };
  let checker;
  try {
    await waitFor(() => fs.existsSync(marker));
    checker = Number(fs.readFileSync(marker, 'utf8').split('\n')[0]);
    runner.kill('SIGINT');
    await waitFor(() => fs.readFileSync(marker, 'utf8').includes('term'));
    runner.kill('SIGINT');
    await waitFor(() => runner.exitCode !== null || runner.signalCode !== null);
    assert.deepEqual(await exit, { code: 1, signal: null });
    const receipt = JSON.parse(fs.readFileSync(path.join(out, 'run.json')));
    assert.equal(receipt.passed, false);
    assert.equal(receipt.records.length, 1);
    const state = `/proc/${checker}/stat`;
    assert.ok(!fs.existsSync(state) || fs.readFileSync(state, 'utf8').split(') ')[1].startsWith('Z'),
      'the admitted checker survived the second interrupt');
  } finally {
    if (runner.exitCode === null && runner.signalCode === null) runner.kill('SIGKILL');
    if (checker) {
      try { process.kill(checker, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
    await exit;
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
