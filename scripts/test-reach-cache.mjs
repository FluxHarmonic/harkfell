import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { inputs, run, collect, compare, ids, legs } from './reach-checks.mjs';
import { attestBuild, dependencyScopes } from './reach-cache.mjs';

test('preflight cannot omit a scope or its cross-region abilities', () => {
  assert.throws(() => dependencyScopes('PASS reach-cache-inputs: parse seams map green; 11 physics scopes', ids), /empty/);
  assert.throws(() => dependencyScopes('FAIL invalid world', ids), /failed/);
});

test('cold/warm cache and room, ability, checker, parse, topology and corruption sabotage', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reach-cache-test-'));
  const prior = process.cwd();
  const put = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  };
  const cloud = 'world/rooms/cloudstair/x8y0.room';
  const ability = 'world/rooms/reedfen/x11y3.room';
  const outside = 'world/rooms/wrongwater/x1y1.room';
  for (const file of [cloud, ability, outside, 'world/world.sgl', 'world/regions/cloudstair.map',
    'src/checker.sgl', 'package.sgl', 'sigil.lock']) put(file, 'GREEN\n');
  execFileSync('git', ['init', '-q', root]);
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=David Wilson', '-c', 'user.email=david@daviwil.com',
    'commit', '-qm', 'Checker cache fixture'], { cwd: root });
  const allRows = Object.fromEntries(legs.map(name => [name,
    Array.from({ length: 16 }, (_, mask) => [2, 3, 4, 5].filter((_, i) => mask & (1 << i)))
      .flatMap(carry => ['#f', '#t'].map(down => `(${name} carry (${carry.join(' ')}) down ${down} phases 480 window-failures 0 survivors 480 no-down-crossings 0 stranded () required-return #t unreachable-profile-return-misses 0)`)).join('\n')]));
  const preflight = [
    ...ids.flatMap(id => (id === 'outside' ? [outside, ability] : [cloud]).map(file => `CACHE-ROOM ${id} ${file}`)),
    `CACHE-ABILITY ${ability}`, 'CACHE-LAYOUT cloudstair 8 0', 'CACHE-LAYOUT reedfen 11 3',
    'CACHE-LAYOUT wrongwater 1 1', 'PASS reach-cache-inputs: parse seams map green; 11 physics scopes',
  ].join('\n');
  put('build/release/bin/harkfell', `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
const read = file => fs.readFileSync(file, 'utf8');
if (args.includes('--reach-cache-inputs')) {
  if (${JSON.stringify([cloud, ability, outside])}.some(file => read(file).includes('PARSE_BAD'))) {
    console.log('FAIL room-check: problems before reach'); process.exit(1);
  }
  console.log(${JSON.stringify(preflight)}); process.exit(0);
}
fs.appendFileSync('checks-ran.log', JSON.stringify(args) + '\\n');
const outside = args.includes('--outside-cloudstair');
if ([outside ? ${JSON.stringify(outside)} : ${JSON.stringify(cloud)}, ${JSON.stringify(ability)}, 'src/checker.sgl']
  .some(file => read(file).includes('BAD'))) {
  console.log('FAIL planted physics regression'); process.exit(1);
}
if (outside) console.log('PASS room-check outside Cloudstair [qualified]: 107 rooms, parse seams map reach green');
else if (args.includes('--cloudstair-timing')) {
  console.log(${JSON.stringify(allRows)}[value('--timing-leg')]);
  console.log('PASS Cloudstair authored timing: 0 failures');
} else {
  console.log('(drain-rounds-limit 0 not-a-gate-verdict)');
  console.log('(region carry (' + value('--carry').replaceAll(',', ' ') + ') down #t entry-phases 480 entry-failures 0 required-cells 525 unreached () traps 0 actual-landings 13104 complete #f)');
  process.exitCode = 2;
}
`);
  fs.chmodSync(path.join(root, 'build/release/bin/harkfell'), 0o755);
  try {
    process.chdir(root);
    const binary = './build/release/bin/harkfell', cache = 'build/verdict-cache';
    const attest = () => attestBuild(inputs(), binary);
    attest();
    const cold = await run({ out: 'build/cold', binary, cache, jobs: 3 });
    assert.ok(cold.passed);
    assert.ok(cold.records.every(record => record.cacheHit === false));
    const warm = await run({ out: 'build/warm', binary, cache, jobs: 3 });
    assert.ok(warm.passed);
    assert.ok(warm.records.every(record => record.cacheHit));
    assert.match(compare(collect(['build/cold']), collect(['build/warm'])), /^SAME:/);
    assert.equal(fs.readFileSync('checks-ran.log', 'utf8').trim().split('\n').length, 11);

    // A room regression re-executes its consumers, while outside's independent
    // proof remains a hit. No stale green timing/target verdict may survive.
    put(cloud, 'BAD ROOM\n');
    const roomRed = await run({ out: 'build/room-red', binary, cache, jobs: 3 });
    assert.equal(roomRed.passed, false);
    assert.ok(roomRed.records.filter(record => record.id !== 'outside').every(record => !record.cacheHit && !record.passed));
    assert.ok(roomRed.records.find(record => record.id === 'outside').cacheHit);
    assert.throws(() => collect(['build/room-red']), /invalid run/);
    put(cloud, 'GREEN\n');

    // The down supplier lives outside Cloudstair. It invalidates both a timing
    // scope and an entry profile in another region, and both must actually run.
    put(ability, 'BAD ABILITY\n');
    const abilityRed = await run({ out: 'build/ability-red', binary, cache,
      only: ['targets-2-4', 'timing-F-L'] });
    assert.equal(abilityRed.passed, false);
    assert.ok(abilityRed.records.every(record => !record.cacheHit && !record.passed));
    put(ability, 'GREEN\n');

    put('src/checker.sgl', 'BAD CHECKER\n');
    await assert.rejects(run({ out: 'build/stale', binary, cache, only: ['timing-F-L'] }), /stale checker build/);
    // The double reads source directly; attestation models rebuilding it.
    attest();
    const checkerRed = await run({ out: 'build/checker-red', binary, cache, only: ['timing-F-L'] });
    assert.equal(checkerRed.passed, false);
    assert.equal(checkerRed.records[0].cacheHit, false);
    put('src/checker.sgl', 'GREEN\n');
    attest();

    put(outside, 'PARSE_BAD\n');
    await assert.rejects(run({ out: 'build/parse-red', binary, cache, only: ['timing-F-L'] }), /preflight failed/);
    put(outside, 'BAD OUTSIDE\n');
    const unrelated = await run({ out: 'build/unrelated', binary, cache, only: ['timing-F-L'] });
    assert.ok(unrelated.passed && unrelated.records[0].cacheHit);
    put(outside, 'GREEN\n');

    put('world/world.sgl', 'GREEN changed global ability metadata\n');
    const metadata = await run({ out: 'build/metadata', binary, cache, only: ['timing-F-L'] });
    assert.ok(metadata.passed && !metadata.records[0].cacheHit);
    put('world/world.sgl', 'GREEN\n');

    const key = cold.records.find(record => record.id === 'targets-2-4').cacheKey;
    fs.writeFileSync(path.join(cache, `${key}.json`), '{truncated');
    const repaired = await run({ out: 'build/corrupt-cache', binary, cache, only: ['targets-2-4'] });
    assert.ok(repaired.passed && !repaired.records[0].cacheHit);
    fs.appendFileSync('build/warm/preflight.log', 'corrupted transfer');
    assert.throws(() => collect(['build/warm']), /corrupt preflight/);
  } finally {
    process.chdir(prior);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
