#!/usr/bin/env node
// Covered Reedfen pools must retain blue pigment, with and without H2.
// Sample authored water cells rather than scenery or screenshot labels.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const covered = [...Array(10)].map((_, i) => [i + 8, 4]).concat([[13, 5], [14, 5]]);
const [sheet, pairs] = process.argv.slice(2);
if (!sheet) {
  console.error('usage: scripts/gate-covered-water.mjs MAP.png [H2-pairs-directory]');
  process.exit(2);
}
const world = readFileSync('world/world.sgl', 'utf8');
const blue = world.match(/\(fen-water "#([0-9a-f]{6})"/i)[1];
const rgb = blue.match(/../g).map(v => parseInt(v, 16));

function command(name, args) {
  const result = spawnSync(name, args, { maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${name}: ${result.stderr?.toString() || result.error}`);
  return result.stdout;
}

function image(file) {
  const [width, height] = command('identify', ['-format', '%w %h', file]).toString().split(' ').map(Number);
  return { width, height, pixels: command('convert', [file, '-alpha', 'off', '-depth', '8', 'RGB:-']) };
}

function pools(x, y) {
  const room = readFileSync(`world/rooms/reedfen/x${x}y${y}.room`, 'utf8');
  const rows = [...room.split('grid:')[1].matchAll(/"([^"\n]+)"/g)].slice(0, 11).map(m => m[1]);
  if (rows.length !== 11 || rows.some(r => r.length !== 25)) throw new Error(`bad grid ${x},${y}`);
  const pending = new Set();
  rows.forEach((row, cy) => [...row].forEach((cell, cx) => {
    if (cell === '~') pending.add(cy * 25 + cx);
  }));
  const result = [];
  while (pending.size) {
    const queue = [pending.values().next().value], cells = [];
    pending.delete(queue[0]);
    while (queue.length) {
      const cell = queue.pop(), cx = cell % 25, cy = Math.floor(cell / 25);
      cells.push([cx, cy]);
      for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
        const next = ny * 25 + nx;
        if (nx >= 0 && nx < 25 && ny >= 0 && ny < 11 && pending.delete(next)) queue.push(next);
      }
    }
    result.push(cells);
  }
  return result;
}

let failed = 0, checked = 0;
function check(frame, x, y, scale, ox, oy, label) {
  for (const [index, cells] of pools(x, y).entries()) {
    let count = 0, total = 0;
    for (const [cx, cy] of cells) {
      for (let py = cy * 16; py < (cy + 1) * 16; py++) {
        for (let px = cx * 16; px < (cx + 1) * 16; px++) {
          // The overview draws coordinate text across its first ten rows.
          if (label === 'map' && py < 10) continue;
          const ix = ox + px * scale, iy = oy + py * scale;
          if (ix >= frame.width || iy >= frame.height) throw new Error('crop outside image');
          const offset = 3 * (iy * frame.width + ix);
          if (rgb.every((v, i) => frame.pixels[offset + i] === v)) count++;
          total++;
        }
      }
    }
    const minimum = Math.max(16, Math.ceil(total * 0.1));
    const pass = count >= minimum;
    console.log(`water: ${pass ? 'GREEN' : 'RED'} ${x},${y} ${label} pool ${index + 1}: ${count}/${total} blue pixels (need ${minimum})`);
    checked++;
    if (!pass) failed++;
  }
}

try {
  const map = image(sheet);
  for (const [x, y] of covered) {
    check(map, x, y, 1, 4 + (x - 8) * 404, 4 + (y - 3) * 180, 'map');
    if (pairs) {
      for (const state of ['without', 'with']) {
        check(image(`${pairs}/x${x}y${y}-${state}-H2.png`), x, y, 2, 0, 0, `${state}-H2`);
      }
    }
  }
  console.log(`water: ${failed ? 'RED' : 'GREEN'} ${checked} covered-pool checks, ${failed} failures; blue #${blue}`);
  process.exit(failed ? 1 : 0);
} catch (error) {
  console.error(`water: SETUP-FAILED ${error.message}`);
  process.exit(2);
}
