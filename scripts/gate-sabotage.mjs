// gate-sabotage.mjs - A1's content sabotages: each plant must turn
// scripts/room-check red, with the problem naming the room and the cells.
//
//   node scripts/gate-sabotage.mjs [--only NAME,...]
//
// Every leg copies world/ to a fresh temp directory, plants ONE change in
// the copy (cells of a room's grid, by row and column), and runs the release
// binary's --room-check on the copy. The repository's own world/ is never
// written. Before trusting a leg:
//   - the plant is verified to have landed: the planted copy differs from
//     world/ in exactly the cells named (counted, not assumed), and
//   - the control leg (no plant) runs first and must PASS (exit 0), so a red
//     leg is the plant and not a broken world or a broken binary.
// A leg PASSES when the gate exits 1 AND its output holds every expected
// line fragment. Exit 0 all legs as expected, 1 some leg not, 2 SETUP-FAILED.
//
// The legs (harkfell-design section 10, A1's gate):
//   control   no plant: PASS room-check
//   widen     the Old Stone's gap (three tiles, the envelope's edge) widened
//             by one tile: reach red, naming reedfen:10,3 and its cells
//   seam      one row of the Reed Bridge's right edge closed, the Old
//             Stone's left edge left open: seams red, naming both rooms
//   trap      a pit four wide and five deep dug into the Climb Back's shelf:
//             the no-trap check red, naming reedfen:10,4 and the pit's floor
//   ceiling   rock hung from the sky down to head height over the Old
//             Stone's take-off (the lip, column 9) and the gap's first
//             column (8 to 10): reach red, naming reedfen:10,3's far side.
//             Over the lip ALONE it stays green, and rightly: measured with
//             --path, a running jump pressed at the lip leaves the one-tile
//             ceiling in the same tick it launches (16 R, 1 RJ*, 37 RJ from
//             (9,8) to (13,8)); only standing jumps are stopped there.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BIN = path.join(ROOT, "build/release/bin/harkfell");
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;

function setupFailed(why) { console.log("SETUP-FAILED gate-sabotage: " + why); process.exit(2); }
if (!fs.existsSync(BIN)) setupFailed(BIN + " missing; scripts/dev sigil build --config release");
const binTime = fs.statSync(BIN).mtimeMs;
const stale = [];
(function walk(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else if (n.endsWith(".sgl") && s.mtimeMs > binTime) stale.push(p); } })(path.join(ROOT, "src"));
if (stale.length) setupFailed(BIN + " is older than " + stale.slice(0, 3).join(" "));

// The grid rows of a room file: [line index, start col of the string's text] per row.
function gridRows(lines) {
  const out = [];
  const g = lines.findIndex((l) => l.includes("grid:"));
  for (let i = g; i < lines.length && out.length < 11; i++) {
    const q = lines[i].indexOf('"');
    if (q >= 0 && i > g) out.push([i, q + 1]);
    else if (q >= 0 && i === g) out.push([i, q + 1]);
  }
  return out;
}

// cells: [[row, col, char], ...] in a room file of the copy.
function plant(dir, room, cells) {
  const f = path.join(dir, "rooms", room);
  const lines = fs.readFileSync(f, "utf8").split("\n");
  const rows = gridRows(lines);
  for (const [r, c, ch] of cells) {
    const [li, start] = rows[r];
    const line = lines[li];
    lines[li] = line.slice(0, start + c) + ch + line.slice(start + c + 1);
  }
  fs.writeFileSync(f, lines.join("\n"));
}

// Cells that differ between the repo's world/ and the copy, over every room file.
function changedCells(dir) {
  let n = 0;
  const rd = path.join(ROOT, "world/rooms");
  for (const region of fs.readdirSync(rd)) {
    for (const file of fs.readdirSync(path.join(rd, region))) {
      const a = fs.readFileSync(path.join(rd, region, file), "utf8");
      const b = fs.readFileSync(path.join(dir, "rooms", region, file), "utf8");
      for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) n++;
    }
  }
  return n;
}

function copyWorld() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "harkfell-sabotage-"));
  fs.cpSync(path.join(ROOT, "world"), dir, { recursive: true });
  return dir;
}

function colRange(r, c0, c1, ch) { const out = []; for (let c = c0; c <= c1; c++) out.push([r, c, ch]); return out; }
function rowRange(c, r0, r1, ch) { const out = []; for (let r = r0; r <= r1; r++) out.push([r, c, ch]); return out; }

const LEGS = [
  { name: "control", cells: [], expectRc: 0, expect: ["PASS room-check: 6 rooms"] },
  { name: "widen", room: "reedfen/x10y3.room",
    // the far lip (column 13) goes: air over brackish water, like the gap
    cells: [[9, 13, " "], [10, 13, "x"]],
    expectRc: 1,
    expect: ["reedfen:10,3: cells", "are not reachable from the start", "(14,8)", "(23,8)"] },
  { name: "seam", room: "reedfen/x9y3.room",
    cells: [[5, 24, "#"]],
    expectRc: 1,
    expect: ["x10y3 left edge and x9y3 right edge disagree on rows 5"] },
  { name: "trap", room: "reedfen/x10y4.room",
    cells: [...[5, 6, 7, 8, 9].flatMap((r) => colRange(r, 19, 22, " "))],
    expectRc: 1,
    expect: ["reedfen:10,4: cells (19,9) (20,9) (21,9) (22,9) are traps"] },
  { name: "ceiling", room: "reedfen/x10y3.room",
    cells: [...rowRange(8, 1, 7, "#"), ...rowRange(9, 1, 7, "#"), ...rowRange(10, 1, 7, "#")],
    expectRc: 1,
    expect: ["reedfen:10,3: cells", "are not reachable from the start", "(14,8)"] },
];

let bad = 0;
for (const leg of LEGS) {
  if (only && leg.name !== "control" && !only.includes(leg.name)) continue;   // the control always runs
  const dir = copyWorld();
  if (leg.cells.length) plant(dir, leg.room, leg.cells);
  const changed = changedCells(dir);
  if (changed !== leg.cells.length) {
    console.log(`SETUP-FAILED leg ${leg.name}: the plant changed ${changed} cells, not ${leg.cells.length}`);
    fs.rmSync(dir, { recursive: true, force: true });
    process.exit(2);
  }
  const t0 = Date.now();
  const r = spawnSync(BIN, ["--room-check", "--world", dir], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  const out = (r.stdout || "") + (r.stderr || "");
  const secs = Math.round((Date.now() - t0) / 1000);
  const missing = leg.expect.filter((e) => !out.includes(e));
  const ok = r.status === leg.expectRc && missing.length === 0;
  const problems = out.split("\n").filter((l) => /^world\//.test(l) || /: cells /.test(l));
  console.log(`${ok ? "PASS" : "FAIL"} ${leg.name}: planted ${changed} cells, room-check exit ${r.status} (want ${leg.expectRc}), ${secs} s`);
  for (const p of problems.slice(0, 6)) console.log("    " + p);
  if (missing.length) console.log("    missing: " + missing.join(" | "));
  if (leg.name === "control" && !ok) { console.log("SETUP-FAILED: the control is not green; no leg below means anything"); process.exit(2); }
  if (!ok) bad++;
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(bad === 0 ? "PASS gate-sabotage: every plant red, the control green" : `FAIL gate-sabotage: ${bad} legs not as expected`);
process.exit(bad === 0 ? 0 : 1);
