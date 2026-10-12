#!/usr/bin/env node
// Runner-only controls. Copies source/world to disposable scratch trees;
// never mutates the track, its lock or David's save. A control must pass
// before a planted defect can be counted as a useful RED.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'harkfell-depths-red-'));
const tests = ['test/test-depths-gates.sgl', 'test/test-underhum-finale.sgl'];
let failures = 0;

function run(dir, label) {
  const result = spawnSync('sigil', ['test', '--report', ...tests], {
    cwd: dir, encoding: 'utf8', timeout: 1800000,
    env: { ...process.env, DISPLAY: '', WAYLAND_DISPLAY: '' },
  });
  const output = (result.stdout || '') + (result.stderr || '');
  fs.writeFileSync(path.join(scratch, `${label}.log`), output);
  return { status: result.status, output, error: result.error };
}

function plant(dir, file, before, after) {
  const target = path.join(dir, file);
  const source = fs.readFileSync(target, 'utf8');
  if (source.split(before).length !== 2) throw new Error(`plant not unique: ${file}`);
  fs.writeFileSync(target, source.replace(before, after));
  if (fs.readFileSync(target, 'utf8') === source) throw new Error('plant did not land');
}

try {
  const copy = path.join(scratch, 'checkout');
  fs.mkdirSync(copy);
  for (const name of ['src', 'test', 'world', 'assets', 'scripts', '.sigil', 'package.sgl', 'sigil.lock', 'manifest.scm']) {
    fs.cpSync(path.join(root, name), path.join(copy, name), { recursive: true, verbatimSymlinks: true });
  }
  const control = run(copy, 'control');
  if (control.status !== 0) throw new Error(`control failed (${control.status}): ${control.output.slice(-3000)}`);
  console.log('GREEN depths mechanics control');
  const plants = [
    ['heart-live', 'src/harkfell/gates.sgl',
      '(or (stone-keys s) (list (stone-overtone s)))', '(list (stone-overtone s))'],
    ['heart-reach', 'src/harkfell/content.sgl',
      '(every (lambda (h) (and (memv h carry) #t)) (stone-thing-keys t))',
      '(and (memv (thing-kw t "overtone") carry) #t)'],
    ['drip-short', 'src/harkfell/gates.sgl', '(* 60 (stone-still s))', '(* 58.8 (stone-still s))'],
    ['fuse-short', 'src/harkfell/underhum/finale.sgl', '(>= still 120)', '(>= still 119)'],
    ['coda-repeat', 'src/harkfell/underhum/finale.sgl', '(not (finale-coda f))', '#t'],
  ];
  for (const [label, file, before, after] of plants) {
    const original = fs.readFileSync(path.join(copy, file), 'utf8');
    plant(copy, file, before, after);
    const red = run(copy, label);
    fs.writeFileSync(path.join(copy, file), original);
    // A compiler/setup error is not a regression RED. Require a failed
    // assertion from one of the unchanged tests, as well as nonzero status.
    const useful = red.status !== null && red.status !== 0 && /assert|expected|Assertion/i.test(red.output)
      && !/error:.*(syntax|unbound|undefined)/i.test(red.output);
    console.log(`${useful ? 'RED' : 'FAIL'} ${label} rc=${red.status}`);
    if (!useful) failures++;
  }
  console.log(`${failures ? 'FAIL' : 'PASS'} depths sabotage: ${failures} failures; logs ${scratch}`);
  process.exitCode = failures ? 1 : 0;
} catch (error) {
  console.log(`SETUP-FAILED depths sabotage: ${error.message}; logs ${scratch}`);
  process.exitCode = 2;
}
