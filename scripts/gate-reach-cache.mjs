#!/usr/bin/env node
// Run on an isolated build host. --sabotage temporarily edits authored inputs
// and rebuilds a planted checker, restoring every byte in finally blocks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { inputs, run, collect, compare } from './reach-checks.mjs';
import { attestBuild } from './reach-cache.mjs';

const root = path.resolve(process.argv[2] || 'build/reach-cache-gate');
const sabotage = process.argv[3] === '--sabotage';
const binary = './build/release/bin/harkfell';
fs.mkdirSync(root, { recursive: false });
const cache = path.join(root, 'verdict-cache');
const dir = name => path.join(root, name);
const controls = {};

async function changed(file, edit, body) {
  const original = fs.readFileSync(file);
  const plant = edit(original.toString());
  assert.notEqual(plant, original.toString(), `plant did not land: ${file}`);
  fs.writeFileSync(file, plant);
  try { return await body(); }
  finally { fs.writeFileSync(file, original); }
}

async function red(name) {
  const result = await run({ out: dir(name), cache, only: ['timing-F-L'] });
  assert.equal(result.passed, false, `${name}: regression passed`);
  assert.equal(result.cache.preflight.code, 0, `${name}: must reach physics after valid content`);
  assert.equal(result.records[0].cacheHit, false, `${name}: stale cache hit`);
  assert.equal(result.records[0].code, 1);
  const log = fs.readFileSync(path.join(dir(name), result.records[0].log), 'utf8');
  assert.match(log, /window-failures [1-9][0-9]*/, `${name}: timing plant did not fail its window`);
  controls[name] = { status: 'EXPECTED RED', cacheHit: false, rawCode: result.records[0].code };
}

async function main() {
  assert.equal(execFileSync('git', ['status', '--porcelain', '--untracked-files=no']).toString(), '', 'requires clean tracked source');
  const cold = await run({ out: dir('cold'), cache, jobs: 4 });
  assert.ok(cold.passed && cold.records.every(record => !record.cacheHit));
  const warm = await run({ out: dir('warm'), cache, jobs: 4 });
  assert.ok(warm.passed && warm.records.every(record => record.cacheHit));
  assert.match(compare(collect([dir('cold')]), collect([dir('warm')])), /^SAME:/);
  if (sabotage) {
    await changed('world/rooms/cloudstair/x8y0.room', text =>
      text.replace('kind: pulsed-lift', 'kind: homeward gate: (0 0)'), () => red('room-red'));

    await changed('world/rooms/reedfen/x11y3.room', text =>
      text.replace('(down at: (14 8))', '(down at: (13 8))'), async () => {
      const result = await run({ out: dir('ability-recheck'), cache, only: ['timing-F-L'] });
      assert.ok(result.passed && !result.records[0].cacheHit);
      assert.notEqual(result.records[0].cacheKey, cold.records.find(record => record.id === 'timing-F-L').cacheKey);
      controls.ability = { status: 'RECHECKED', cacheHit: false,
        supplier: 'reedfen:11,3', consumer: 'Cloudstair F-L', rawCode: result.records[0].code };
    });

    const oldBinary = fs.readFileSync(binary);
    const buildFile = 'build/release/reach-build.json';
    const oldBuild = fs.readFileSync(buildFile);
    try {
      await changed('src/engine/air.sgl', text => text.replace('(define AIR-GUST 300)', '(define AIR-GUST 480)'), async () => {
        await assert.rejects(run({ out: dir('stale-checker'), cache, only: ['timing-F-L'] }), /stale checker build/);
        controls.staleChecker = { status: 'EXPECTED RED before running stale binary' };
        const fd = fs.openSync(dir('checker-plant-build.log'), 'wx');
        try {
          execFileSync('scripts/dev', ['sigil', 'build', '--config', 'release'], {
            stdio: ['ignore', fd, fd], timeout: 1800000,
          });
        } finally { fs.closeSync(fd); }
        attestBuild(inputs(), binary);
        await red('checker-red');
      });
    } finally {
      fs.writeFileSync(binary, oldBinary);
      fs.writeFileSync(buildFile, oldBuild);
    }

    await changed('world/rooms/wrongwater/x-2y7.room', text => text + '\n(\n', async () => {
      await assert.rejects(run({ out: dir('parse-red'), cache, only: ['timing-F-L'] }), /preflight failed/);
      controls.parse = { status: 'EXPECTED RED before any cached physics verdict' };
    });
    assert.equal(inputs().digest, cold.inputs.digest);
    const restored = await run({ out: dir('restored'), cache, jobs: 4 });
    assert.ok(restored.passed && restored.records.every(record => record.cacheHit));
    assert.match(compare(collect([dir('cold')]), collect([dir('restored')])), /^SAME:/);
    assert.equal(execFileSync('git', ['diff']).length, 0);
  }
  const summary = { passed: true, inputs: cold.inputs.digest, coldSeconds: cold.seconds,
    warmSeconds: warm.seconds, hits: warm.records.filter(record => record.cacheHit).length,
    controls, fullReturnProof: false };
  fs.writeFileSync(dir('summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(`RESULT reach-cache PASS cold=${cold.seconds}s warm=${warm.seconds}s hits=${summary.hits}/11 sabotage=${sabotage}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
