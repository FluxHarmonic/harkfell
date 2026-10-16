#!/usr/bin/env node
// Exact differential checks, then the complete unchanged outside release view.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { normalized, verdict } from './reach-checks.mjs';

const out = path.resolve(process.argv[2]);
const reference = process.argv[3];
const workers = Number(process.argv[4] || 8);
const profiling = process.argv.includes('--profile');
const thresholdIndex = process.argv.indexOf('--young-threshold');
const youngThreshold = thresholdIndex < 0 ? 524288 : Number(process.argv[thresholdIndex + 1]);
assert.ok(reference && Number.isInteger(workers) && workers >= 1 && workers <= 10);
assert.ok(Number.isInteger(youngThreshold) && youngThreshold >= 524288 && youngThreshold <= 67108864,
  '--young-threshold must be an integer from 524288 to 67108864 bytes');
fs.mkdirSync(out, { recursive: false });
const env = { ...process.env };
for (const name of Object.keys(env)) {
  if (/^(HARKFELL_|SIGIL_GC_|SIGIL_YOUNG_)/.test(name)) delete env[name];
}
Object.assign(env, { SIGIL_YOUNG_THRESHOLD: String(youngThreshold),
  SIGIL_YOUNG_THRESHOLD_MAX: String(youngThreshold) });

function check(name, world, count, checked = false, profile = false) {
  const log = path.join(out, `${name}.log`);
  const fd = fs.openSync(log, 'wx');
  const diagnostics = path.join(out, `${name}.stderr.log`);
  const errorFd = fs.openSync(diagnostics, 'wx');
  const start = Date.now();
  console.log(`START ${name} workers=${count} ${new Date(start).toISOString()}`);
  let result;
  try {
    result = spawnSync('timeout', ['--kill-after=10', '7200', './build/release/bin/harkfell',
      '--room-check', '--outside-cloudstair', '--world', world, '--workers', String(count)], {
      stdio: ['ignore', fd, errorFd], env: { ...env,
        ...(checked ? { HARKFELL_ROUTE_CHECK: '1' } : {}),
        ...(profile ? { HARKFELL_REACH_PROF: '1' } : {}) },
    });
  } finally { fs.closeSync(fd); fs.closeSync(errorFd); }
  const text = fs.readFileSync(log, 'utf8');
  const errors = fs.readFileSync(diagnostics, 'utf8');
  assert.ok(!result.error && !result.signal && [0, 1].includes(result.status), `${name}: checker failed to complete`);
  assert.doesNotMatch(text + errors, /Error \(|route check:|SETUP-FAILED/);
  const receipt = { name, world, workers: count, rawCode: result.status,
    seconds: (Date.now() - start) / 1000, result: normalized('outside', text), log };
  console.log(`RESULT ${name} raw=${result.status} wall=${receipt.seconds}s`);
  return receipt;
}

const fixtures = [];
for (const [name, expected] of [['carry-softlock', 1], ['carry-softlock-rock', 0],
  ['carry-key-in-pit', 0], ['carry-jump-over', 1]]) {
  const world = `test/fixtures/worlds/${name}`;
  const serial = check(`${name}-serial`, world, 0);
  const parallel = check(`${name}-parallel`, world, 3, true);
  assert.equal(serial.rawCode, expected, `${name}: negative/positive control did not land`);
  assert.equal(parallel.rawCode, expected);
  assert.equal(parallel.result, serial.result, `${name}: full output differs`);
  if (profiling && fixtures.length === 0) {
    const observed = check(`${name}-profiled`, world, 3, true, true);
    assert.equal(observed.rawCode, expected);
    assert.equal(observed.result, serial.result, 'profiling changed fixture output');
    const diagnostic = fs.readFileSync(path.join(out, `${name}-profiled.stderr.log`), 'utf8');
    for (const phase of ['spatial-carry', 'spatial-anchors', 'spatial-prepare-walks',
      'spatial-walks', 'spatial-pool-assign', 'spatial-pool-wait', 'spatial-pool-collect']) {
      assert.ok(diagnostic.includes(phase), `missing profiling phase ${phase}`);
    }
  }
  fixtures.push({ name, expected, equal: true });
}
const serialText = fs.readFileSync(reference, 'utf8');
assert.ok(verdict('outside', 0, serialText), 'reference is not a passing 107-room outside verdict');
const parallel = check('outside-workers', 'world', workers, false, profiling);
assert.equal(parallel.rawCode, 0);
assert.ok(verdict('outside', parallel.rawCode, fs.readFileSync(parallel.log, 'utf8')));
assert.equal(parallel.result, normalized('outside', serialText), 'outside complete output differs from serial');
const summary = { passed: true, workers, profiling, youngThreshold,
  seconds: parallel.seconds, underOneHour: parallel.seconds < 3600,
  equal: 'all outside output lines; only measured seconds normalized', fixtures, reference };
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(`RESULT outside-parallel PASS equality=exact workers=${workers} wall=${summary.seconds}s under-one-hour=${summary.underOneHour}`);
