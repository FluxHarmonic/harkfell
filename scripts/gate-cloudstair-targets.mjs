#!/usr/bin/env node
// The shipped 0.4 scope: every required cell for both entries, with the
// cell-return drain deferred. Keep the checker's incomplete verdict intact.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const out = path.resolve(process.argv[2] || 'build/cloudstair-targets');
fs.mkdirSync(out, { recursive: true });
const receipts = [];
for (const carry of ['2,4', '2,3,4']) {
  const name = `cloudstair-targets-${carry.replaceAll(',', '-')}`;
  const log = path.join(out, `${name}.log`);
  const fd = fs.openSync(log, 'w');
  const result = spawnSync('timeout', ['18000', './build/release/bin/harkfell',
    '--room-check', '--cloudstair-region', '--carry', carry,
    '--cell-returns', '--workers', '3'], {
    stdio: ['ignore', fd, fd],
    env: { ...process.env,
      HARKFELL_REGION_DRAIN_ROUNDS: '0',
      HARKFELL_REGION_LANDING_BOUND: '1000000',
      SIGIL_GC_HEAP_GROW_FACTOR: '1.3',
      SIGIL_YOUNG_THRESHOLD: '524288',
      SIGIL_YOUNG_THRESHOLD_MAX: '524288' },
  });
  fs.closeSync(fd);
  const text = fs.readFileSync(log, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const summaries = text.split('\n').filter(line => line.startsWith('(region carry '));
  const expected = `(region carry (${carry.replaceAll(',', ' ')}) down #t entry-phases 480 entry-failures 0 required-cells 525 unreached () traps 0 `;
  const passed = !result.error && result.status === 2
    && summaries.length === 1 && summaries[0].startsWith(expected)
    && / actual-landings \d+ complete #f\)$/.test(summaries[0])
    && text.includes('(drain-rounds-limit 0 not-a-gate-verdict)')
    && !/\(RED |Error \(|SETUP-FAILED|route check:/.test(text);
  receipts.push({ carry, down: true, status: passed ? 'PASS targets only' : 'FAIL',
    checkerStatus: result.status, checkerError: result.error?.message,
    summary: summaries, log, fullReturnProof: false });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: targets/entry phases only; full cell returns deferred; checker rc=${result.status}`);
  if (!passed) console.log(text.slice(-2500));
}
fs.writeFileSync(path.join(out, 'cloudstair-targets.json'), JSON.stringify(receipts, null, 2) + '\n');
process.exitCode = receipts.every(receipt => receipt.status === 'PASS targets only') ? 0 : 1;
