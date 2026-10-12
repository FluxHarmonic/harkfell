#!/usr/bin/env node
// The Pipes' music, composed (D53, the stone organ): writes assets/tunes/
// wind-in-stone, three-echoes, the-pipes-breathe, air-below, seep-song,
// hollow-octave and pickup-h4 from the scores below.
//
//   node tools/pipes-compose.mjs          write the tunes
//   node tools/pipes-compose.mjs --check  exit 1 if a written tune differs
//
// The carved pipes are an organ nobody plays; the wind sounds chords on them.
// The region's tune (THEME) is an octave leap, A3 to A4, that falls back G F E
// and stops on C4, one step under D4, H4's note. Nothing heard in the Pipes
// before H4 is carried sounds a D4 at all (checked here and in
// test/test-pipes-sound.sgl). The homecoming (hollow-octave) makes the leap on
// D, D3 to D4, and lands. A player may bring H4 home without H3 or H5, so the
// homecoming sounds no A and no F# (Cloudstair's hollow-third rule).
//
// Voices: the long rank (the tune: drone-fm with its modulator at twice the
// note, so odd harmonics only, a stopped pipe), the wind on its lip (pipe-breath
// on the same notes), the ranks (chords, drone-fm, slow attack, breathing), the
// pedal (the low line every homecoming uses), the octave rank (the tune an
// octave up), and drops whose returns fall on the eighth notes at 72 bpm.
// None of them is the bed's; the bed is pipes-bed (edited by hand, channel 3).
// Moments are 72 bpm at speed 6: 16 rows a bar, 3.33 s.
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const FLATS = { Bb: "A#", Eb: "D#", Ab: "G#", Db: "C#", Gb: "F#" };
const PCS = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
function cell(n) {
  const m = /^([A-G][b#]?)(\d)$/.exec(n);
  if (!m) throw new Error(`bad note ${n}`);
  const name = FLATS[m[1]] || m[1];
  return name.length === 1 ? `${name}-${m[2]}` : `${name}${m[2]}`;
}
const pcOf = (n) => { const c = cell(n); return PCS[c.slice(0, 2).replace("-", "")]; };
const midi = (n) => { const c = cell(n); return 12 * (Number(c[2]) + 1) + pcOf(n); };
const up = (n, k = 1) => n.replace(/(\d)$/, (d) => String(Number(d) + k));

// --- the voices ---------------------------------------------------------------
const DRIP = "drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15";
const RANK = "drone-fm level: 0.3 index: 1.3 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.25 release: 1.2";
const LIP = "pipe-breath level: 0.4 width: 0.05 octave: 0.9 tone: 0.05 swell: 0.5 swell-rate: 0.12 attack: 0.3 release: 1.5 seed: 23";
const RANKS = "drone-fm level: 0.3 index: 1.4 index-wander: 0.2 index-rate: 0.1 mod: 1 breath-lo: 0.75 breath-rate: 0.25 attack: 1.4 release: 2.5 seed: 41";
const PEDAL = "drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 0.8 release: 2.5 seed: 11";
const OCT = "drone-fm level: 0.3 index: 0.4 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.3 release: 1.2";
const G = 0.5;   // instrument gain for the moments: they sit at the other regions' moment loudness
const VOICES = [
  [1, "the long rank", RANK, 34, G * 1.5, 0.5],
  [2, "wind on its lip", LIP, 24, G * 2.2, 0.5],
  [3, "drop with soft returns", DRIP, 30, G * 1.6, 0.3],
  [4, "the ranks", RANKS, 22, G * 1.2, 0.5],
  [5, "pedal", PEDAL, 28, G * 1.2, 0.35],
  [6, "the octave rank", OCT, 16, G * 1.2, 0.6],
];
// the homecoming's stone bells (hollow-answers', hollow-fifth's)
const BELL = [7, "stone bell", "fm4-bell index: 1.0 amp-decay: 3.5 amp-release: 1.5 vel-depth: 0.5", 40, G * 1.08, 0.45];

// the tune, and its answer as the Long Pipe sings it
const THEME = "A3:8 A4:8 G4:4 F4:4 E4:8 C4:16";
const ANSWER = "A3:8 A4:8 Bb4:4 A4:4 G4:8 F4:4 E4:4 F4:4 G4:4 E4:8 C4:24";
const FALL = "G4:4 F4:4 E4:8 C4:16";

// channels: 1 tune, 2 lip, 3 drops, 4-6 ranks, 7 pedal, 8 octave rank
const RK = [4, 5, 6];
class Tune {
  constructor(name, bars, { tempo = 72, speed = 6, voices = VOICES, history, d4 = false, tail = 29, level = 1 }) {
    // level: a tune's gains scaled to sit with the rest (measured: tools/pipes-levels.jobs, checked by scripts/gate-pipes-sound)
    Object.assign(this, { name, bars, tempo, speed, voices, history, d4, tail, level, ev: new Map() });
  }
  get rows() { return this.bars * 16; }
  put(row, ch, note, inst, vol) {
    if (row < 0 || row >= this.rows) throw new Error(`${this.name}: row ${row} outside ${this.rows}`);
    const k = `${row}/${ch}`, had = this.ev.get(k);
    if (had && !(had.soft && note !== "off")) throw new Error(`${this.name}: two events at row ${row} channel ${ch}`);
    if (had && note === "off") return;
    if (note !== "off" && !this.d4 && midi(note) === 62) throw new Error(`${this.name}: D4 at row ${row} channel ${ch} (H4's note, before H4)`);
    this.ev.set(k, { row, ch, note: note === "off" ? "===" : cell(note), inst: note === "off" ? 0 : inst, vol: note === "off" ? 0 : vol, soft: false });
  }
  off(row, ch, soft = false) { if (row >= this.rows) return; this.put(row, ch, "off"); if (soft) this.ev.get(`${row}/${ch}`).soft = true; }
  line(ch, row, inst, vol, spec) {
    for (const tok of spec.trim().split(/\s+/)) {
      const [n, d] = tok.split(":");
      if (n === "r") { if (!this.ev.has(`${row}/${ch}`)) this.off(row, ch); } else this.put(row, ch, n, inst, vol);
      row += Number(d);
    }
    if (row < this.rows && !this.ev.has(`${row}/${ch}`)) this.off(row, ch, true);
    return row;
  }
  // the tune on the long rank, the lip and the octave rank together
  sing(row, spec, vol = 34) {
    this.line(1, row, 1, vol, spec);
    this.line(2, row, 2, Math.round(vol * 0.65), spec);
    this.line(8, row, 6, Math.round(vol * 0.42), spec.replace(/([A-G]b?#?)(\d)/g, (m, n, o) => n + (Number(o) + 1)));
  }
  chord(row, notes, low, vol = 20) {
    notes.forEach((n, i) => this.put(row, RK[i], n, 4, vol));
    if (low) this.put(row, 7, low, 5, 28);
  }
  release(row, chs = [4, 5, 6, 7]) { for (const ch of chs) this.off(row, ch); }
  drop(row, note, vol = 26) { this.put(row, 3, note, 3, vol); }
  text() {
    const patterns = [], order = [];
    for (let r0 = 0; r0 < this.rows; r0 += 64) {
      const r1 = Math.min(this.rows, r0 + 64), rows = new Map();
      for (const e of this.ev.values()) if (e.row >= r0 && e.row < r1) {
        const r = e.row - r0; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(e);
      }
      const body = [...rows.keys()].sort((a, b) => a - b).map((r) =>
        `      (row ${r} ${rows.get(r).sort((a, b) => a.ch - b.ch).map((e) => `(${e.ch} "${e.note}" ${e.inst} ${e.vol} "000")`).join(" ")})`);
      patterns.push(`    (pattern id: ${patterns.length} rows: ${r1 - r0}\n${body.join("\n")})`);
      order.push(patterns.length - 1);
    }
    // a silent pattern so the ranks and the reverb ring out (the moment is over at -50 dBFS)
    if (this.tail) { patterns.push(`    (pattern id: ${patterns.length} rows: ${this.tail})`); order.push(patterns.length - 1); }
    // every held voice is released before the tail: a hanging drone-fm note keeps the moment
    // "playing" and the sky hazed (D51). Bells, drops and the pickup's bell decay by themselves.
    const held = (id) => /^(drone-fm|drone-saw|pipe-breath|noise-bed) /.test((this.voices.find(([i]) => i === id) || [, , ""])[2]);
    for (let ch = 1; ch <= 8; ch++) {
      const last = [...this.ev.values()].filter((e) => e.ch === ch).sort((x, y) => y.row - x.row)[0];
      if (last && last.inst && held(last.inst)) throw new Error(`${this.name}: channel ${ch} is never released (row ${last.row})`);
    }
    const used = new Set([...this.ev.values()].map((e) => e.inst).filter(Boolean));
    for (let ch = 1; ch <= 8; ch++) {
      const s = new Set([...this.ev.values()].filter((e) => e.ch === ch && e.inst).map((e) => e.inst));
      if (s.size > 8) throw new Error(`${this.name}: channel ${ch} uses ${s.size} instruments (motif allows 8)`);
    }
    const insts = this.voices.filter(([id]) => used.has(id)).map(([id, nm, patch, vol, gain, send]) => {
      if (gain * this.level > 4) throw new Error(`${this.name}: instrument ${id} gain over motif's cap of 4`);
      return `    (instrument id: ${id} name: "${nm}" patch: (${patch}) volume: ${vol} gain: ${+(gain * this.level).toFixed(3)} send: ${send})`;
    });
    const chans = Math.max(...[...this.ev.values()].map((e) => e.ch));
    return `(tune version: 1 name: "${this.name}" tempo: ${this.tempo} speed: ${this.speed} channels: ${chans}
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
${insts.join("\n")})
  (patterns
${patterns.join("\n")})
  (order ${order.join(" ")})
  (history ("claude" "2026-10-12" ${JSON.stringify(this.history + " Written by tools/pipes-compose.mjs; edit the score there.")})))
`;
  }
}

const tunes = [];

// B · Wind's Mouth, first visit: the first Pipes music you hear. The wind fills
// the ranks one by one, then the tune is said once, and the wind takes it back.
{
  const t = new Tune("wind-in-stone", 10, { history: "Pipes SOUND (D53, the stone organ): Wind's Mouth, first visit. The wind rises in a carved mouth and the ranks sound as it fills them (Am, then F); the long rank states the Pipes' tune once, the octave leap A3 to A4 falling to C4 over Dm, C, F/A; the ranks hold B-flat, then C; the wind takes it back to A minor." });
  t.line(2, 0, 2, 26, "A3:16 E4:16");               // the wind first, alone on the lip
  t.chord(8, ["A3"], null, 16); t.put(16, 5, "E4", 4, 16); t.put(24, 6, "C4", 4, 15);
  t.put(16, 7, "A2", 5, 24);
  t.drop(28, "C6", 22);
  t.chord(32, ["F3", "A3", "C4"], "F2", 18);
  t.chord(48, ["F3", "A3", "F4"], "D3", 20);
  t.sing(48, THEME);
  t.chord(64, ["G3", "C4", "E4"], "C3", 20);
  t.chord(80, ["F3", "A3", "C4"], "A2", 20);
  t.drop(90, "A5", 24);
  t.chord(96, ["F3", "Bb3", "F4"], "Bb2", 20);
  t.chord(112, ["G3", "C4", "E4"], "C3", 18);
  t.drop(118, "E6", 20);
  t.line(2, 112, 2, 24, "E4:16 A3:24");
  t.chord(128, ["A3", "C4", "E4"], "A2", 16);
  t.release(152);
  tunes.push(t);
}

// N · The Drip Bowl, still 8 s: one drop strikes a hollow stone and answers;
// each drop wakes a chord in the ranks, further off each time. Then the long
// rank takes the tune's fall, and the last drop answers it.
{
  const t = new Tune("three-echoes", 10, { level: 1.2, history: "Pipes SOUND (D53, the stone organ): the Drip Bowl, still: 8. Three drops (A5, E6, C6), each answered by a chord in the ranks (Am, F, Dm), quieter each time; then the long rank sings the tune's fall, G F E to C4, over C, and a last drop answers." });
  t.drop(0, "A5", 30);
  t.chord(4, ["A3", "C4", "E4"], "A2", 18);
  t.drop(32, "E6", 26);
  t.chord(36, ["F3", "A3", "C4"], "F2", 16);
  t.drop(64, "C6", 22);
  t.chord(68, ["F3", "A3", "F4"], "D3", 14);
  t.sing(96, FALL, 32);
  t.chord(96, ["G3", "Bb3", "G4"], "G2", 16);
  t.chord(112, ["G3", "C4", "E4"], "C3", 16);
  t.drop(136, "A5", 22);
  t.release(144);
  tunes.push(t);
}

// R · The Long Pipe, first visit: the chorale (sketch B, as David chose it).
// The tune, a bar's rest while the wind holds B-flat, then its answer, which
// stops on C4 over a C major chord: the finding tone's D4, one room below, is
// the note it waits for.
{
  const t = new Tune("the-pipes-breathe", 11, { history: "Pipes SOUND (D53, the stone organ): the Long Pipe, first visit. An organ chorale the wind plays: Dm C F/A B-flat | Dm Gm F C Am C. The long rank leaps an octave and falls back to C4, a step under H4's D4, and ends on C major, the flat seventh, under the finding tone one room below." });
  const H = [[0, ["F3", "A3", "F4"], "D3"], [16, ["F3", "A3", "F4"], "D3"], [32, ["G3", "C4", "E4"], "C3"], [48, ["F3", "A3", "C4"], "A2"], [64, ["F3", "Bb3", "F4"], "Bb2"],
    [80, ["F3", "A3", "F4"], "D3"], [96, ["G3", "Bb3", "G4"], "G2"], [112, ["F3", "A3", "C4"], "F2"], [120, ["G3", "C4", "E4"], "C3"], [128, ["A3", "C4", "E4"], "A2"],
    [144, ["G3", "C4", "E4"], "C3"]];
  for (const [r, ch, low] of H) t.chord(r, ch, low, 20);
  t.sing(16, `${THEME} r:16 ${ANSWER}`);
  for (const [r, n] of [[8, "A5"], [62, "C6"], [74, "A5"], [100, "E6"], [140, "A5"], [160, "C6"]]) t.drop(r, n);
  t.release(168);
  tunes.push(t);
}

// Air Below (wandering, where the pipes are strong): air rising through the
// ranks. Slow chords breathing in and out; the wind on the lip draws a high
// line above them; the octave rank makes the leap once and holds it.
{
  const t = new Tune("air-below", 10, { history: "Pipes SOUND (D53, the stone organ): wandering, pipes 0.6+. Air rising through the ranks: Am, F, C, Gm, Am, F, C, Am, a bar each; the wind on the lip draws a high line, E5 C5 E5 G5 F5 E5; the long rank makes the leap A3 to A4 once and holds it." });
  const H = [[0, ["A3", "C4", "E4"], "A2"], [16, ["F3", "A3", "C4"], "F2"], [32, ["G3", "C4", "E4"], "C3"], [48, ["G3", "Bb3", "G4"], "G2"],
    [64, ["A3", "C4", "E4"], "A2"], [80, ["F3", "A3", "C4"], "F2"], [96, ["G3", "C4", "E4"], "C3"], [112, ["A3", "C4", "E4"], "A2"]];
  for (const [r, ch, low] of H) t.chord(r, ch, low, 18);
  t.line(2, 8, 2, 26, "E5:16 C5:16 E5:8 G5:8 F5:16 E5:24");
  t.line(1, 64, 1, 30, "A3:8 A4:24 G4:8 E4:16");
  t.line(8, 64, 6, 13, "A4:8 A5:24 G5:8 E5:16");
  t.drop(40, "C6", 20); t.drop(100, "A5", 20);
  t.release(136);
  tunes.push(t);
}

// Seep Song (wandering, where the water is strong): the drops are the tune, a
// slow water clock over the ranks; the long rank answers with the fall.
{
  const t = new Tune("seep-song", 9, { level: 1.2, history: "Pipes SOUND (D53, the stone organ): wandering, water 0.6+. Drops as a slow tune (A5 C6 E6 C6, G5 A5 C6 A5, F5 A5 C6 A5, E5 G5 A5), their returns on the eighth notes, over the ranks (Am, C, F, Am); the long rank answers with the tune's fall to C4." });
  const drops = ["A5", "C6", "E6", "C6", "G5", "A5", "C6", "A5", "F5", "A5", "C6", "A5", "E5", "G5", "A5"];
  drops.forEach((n, i) => t.drop(i * 8, n, i % 4 === 0 ? 28 : 22));
  t.chord(0, ["A3", "C4", "E4"], "A2", 16);
  t.chord(32, ["G3", "C4", "E4"], "C3", 16);
  t.chord(64, ["F3", "A3", "C4"], "F2", 16);
  t.chord(96, ["A3", "C4", "E4"], "A2", 16);
  t.sing(96, FALL, 30);
  t.chord(112, ["G3", "C4", "E4"], "C3", 16);
  t.release(136);
  tunes.push(t);
}

// Home · the bowl, first visit carrying H4: the leap on D, D3 to D4, and it
// lands. The stone bells ring H4's own partials (D4 D5 D6). No A (a player may
// carry H4 without H3) and no F# (nor H5).
{
  const t = new Tune("hollow-octave", 10, { d4: true, voices: [...VOICES, BELL], history: "Pipes SOUND (D53, the stone organ): the bowl's fixed moment for the H4 homecoming (first visit carrying 4, after hollow-answers and hollow-fifth). The Pipes' tune made on D: D3 leaps to D4, falls C4 B-flat3 G3, and climbs B-flat3 C4 to land on D4 at last, over Dm, B-flat, Gm, C, Dm; the stone bells ring H4's partials, D4 D5 D6. No A and no F#: a player may bring H4 home without H3 or H5." });
  t.put(0, 7, "D3", 5, 26);
  t.put(0, 3, "D4", 7, 34); t.put(6, 3, "D5", 7, 30); t.put(12, 3, "D6", 7, 26);
  t.chord(16, ["F3", "D4", "F4"], "D3", 20);
  t.sing(16, "D3:8 D4:8 C4:4 Bb3:4 G3:8 Bb3:8 C4:8 D4:32");
  t.chord(32, ["F3", "Bb3", "D4"], "Bb2", 20);
  t.chord(48, ["G3", "Bb3", "D4"], "G2", 20);
  t.chord(56, ["G3", "C4", "E4"], "C3", 20);
  t.chord(64, ["F3", "D4", "F4"], "D3", 22);
  t.put(64, 3, "D5", 7, 32); t.put(72, 3, "D6", 7, 26);
  t.chord(96, ["F3", "D4", "F4"], "D3", 18);
  t.put(104, 3, "D4", 7, 30);
  t.release(144);
  tunes.push(t);
}

// The H4 pickup: the ranks speak up H4's own partials, 4 8 12 16 20 24 times
// D2, each at its just tuning (motif's bell kind ignores cents:, so the old F#6
// rang 13.7 cents sharp); a stone bell strikes the D4 that the region held back.
{
  const JUST = { 4: 0, 8: 0, 12: 1.955, 16: 0, 20: -13.686, 24: 1.955 };
  const notes = [[4, "D4"], [8, "D5"], [12, "A5"], [16, "D6"], [20, "F#6"], [24, "A6"]];
  // partial 4 (D4, 293.7 Hz) sits under the speaker check's 300 Hz: its rank takes even harmonics too
  // (modulator at the note, index 1.4) so a phone keeps it (design D10)
  const voices = notes.map(([k, n], i) => [i + 1, `H4's partial ${k}`, `drone-fm level: 0.3 index: ${k === 4 ? "1.4" : "1.3"} index-wander: 0 mod: ${k === 4 ? 1 : 2} breath-lo: 1 attack: 0.03 release: 1.4${JUST[k] ? ` cents: ${JUST[k]}` : ""}`, 40 - 3 * i, 0.9, 0.5]);
  voices.push([7, "the stone strikes", "fm4-bell index: 1.0 amp-decay: 2.6 amp-release: 1.2 vel-depth: 0.5", 40, 0.6, 0.5]);
  const t = new Tune("pickup-h4", 2, { tempo: 120, speed: 4, voices, d4: true, tail: 8, level: 1.6, history: "Pipes SOUND (D53): H4 taken. The stone organ's ranks speak H4's own partials, 4 8 12 16 20 24 times D2 (D4 D5 A5 D6 F#6 A6), each at its just tuning on a drone-fm rank that honours cents:, a stone bell striking the D4 the Pipes held back." });
  t.put(0, 7, "D4", 7, 40);
  notes.forEach(([, n], i) => t.put(i * 2, i + 1, n, i + 1, 40 - 3 * i));
  for (let i = 0; i < 6; i++) t.off(18 + i, i + 1);
  tunes.push(t);
}

let differ = 0;
for (const t of tunes) {
  const f = join(ROOT, "assets", "tunes", `${t.name}.cts`), text = t.text();
  if (CHECK) {
    let had = ""; try { had = readFileSync(f, "utf8"); } catch {}
    if (had !== text) { console.log(`DIFFERS ${t.name}`); differ++; }
  } else { writeFileSync(f, text); console.log(`wrote ${t.name}`); }
}
if (CHECK) { console.log(differ ? `${differ} tune(s) differ from the score` : `all ${tunes.length} tunes match the score`); process.exit(differ ? 1 : 0); }
