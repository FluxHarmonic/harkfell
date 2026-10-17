import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { run, collect, compare, legs, ids, verdict, normalized } from './reach-checks.mjs';

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

test('bounded scheduler, monolithic serial comparison, distributed collection and fail-closed controls', async () => {
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
