#!/usr/bin/env node
// Stage 1 sketches for the Pipes' sound rethink.
// Writes tools/pipes-rethink/sketches/zz-p{a,b,c}-{bed,moment,hook}.cts: three directions,
// each a bed, the Long Pipe's moment (R, the-pipes-breathe) and the hook alone.
// These are listening sketches, not game assets: tools/pipes-rethink/review.sh copies
// them into assets/tunes under their zz- names for the render and removes them again.
//
//   node tools/pipes-rethink/compose.mjs
//
// Moments are 72 bpm at speed 6, 16 rows a bar (3.33 s), like the homecomings and the
// finale. Beds keep pipes-bed's 60 bpm at speed 15 (a row is 0.625 s) and its drone
// channels 4-8 verbatim.
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "sketches");
mkdirSync(OUT, { recursive: true });

const FLATS = { Bb: "A#", Eb: "D#", Ab: "G#", Db: "C#", Gb: "F#" };
function cell(n) {
  const m = /^([A-G][b#]?)(\d)$/.exec(n);
  if (!m) throw new Error(`bad note ${n}`);
  const name = FLATS[m[1]] || m[1];
  return name.length === 1 ? `${name}-${m[2]}` : `${name}${m[2]}`;
}
const MIDI = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
function midi(n) { const c = cell(n); const pc = c.slice(0, 2).replace("-", ""); return 12 * (Number(c[2]) + 1) + MIDI[pc]; }

class Tune {
  constructor(name, { bars, rowsPerBar = 16, tempo = 72, speed = 6, channels = 8, reverb = "zitarev size: 0.9 damp: 0.45 mix: 0.3", instruments, history, tail = 29 }) {
    Object.assign(this, { name, bars, rowsPerBar, tempo, speed, channels, reverb, instruments, history, tail, ev: new Map(), loopFrom: null });
  }
  get rows() { return this.bars * this.rowsPerBar; }
  put(row, ch, note, inst, vol, fx = "000") {
    if (row < 0 || row >= this.rows) throw new Error(`${this.name}: row ${row} outside ${this.rows}`);
    const k = `${row}/${ch}`;
    const had = this.ev.get(k);
    if (had && !(had.soft && note !== "off")) throw new Error(`${this.name}: two events at row ${row} ch ${ch}`);
    if (had && note === "off") return;
    this.ev.set(k, { row, ch, note: note === "off" ? "===" : cell(note), inst: note === "off" ? 0 : inst, vol: note === "off" ? 0 : vol, fx, soft: false });
  }
  off(row, ch, soft = false) { if (row >= this.rows) return; this.put(row, ch, "off", 0, 0); if (soft) this.ev.get(`${row}/${ch}`).soft = true; }
  // "E5:8 C5:8 r:4" (rows); legato; an off after the last note unless open
  line(ch, row, inst, vol, spec, { open = false } = {}) {
    for (const tok of spec.trim().split(/\s+/)) {
      const [n, d] = tok.split(":"); const dur = Number(d);
      if (n === "r") { if (!this.ev.has(`${row}/${ch}`)) this.off(row, ch); }
      else {
        // D4 is H4's note (the finding tone, 293.7 Hz): a moment may pass through it
        // but never hold it (more than a beat) before H4 is carried (the bible).
        if (!this.allowD4 && midi(n) === 62 && dur > 4) throw new Error(`${this.name}: D4 held ${dur} rows at ${row}`);
        this.put(row, ch, n, typeof inst === "function" ? inst(n) : inst, vol);
      }
      row += dur;
    }
    if (!open && row < this.rows && !this.ev.has(`${row}/${ch}`)) this.off(row, ch, true);
    return row;
  }
  chord(row, chs, notes, inst, vol) {
    notes.forEach((n, i) => {
      if (!this.allowD4 && midi(n) === 62) throw new Error(`${this.name}: D4 in a held chord at ${row}`);
      this.put(row, chs[i], n, inst, vol);
    });
  }
  text() {
    const per = this.rowsPerBar === 16 ? 64 : this.rows;   // beds: one pattern
    const patterns = [], order = [];
    for (let r0 = 0; r0 < this.rows; r0 += per) {
      const r1 = Math.min(this.rows, r0 + per);
      const rows = new Map();
      for (const e of this.ev.values()) if (e.row >= r0 && e.row < r1) {
        const r = e.row - r0; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(e);
      }
      const body = [...rows.keys()].sort((a, b) => a - b).map((r) =>
        `      (row ${r} ${rows.get(r).sort((a, b) => a.ch - b.ch).map((e) => `(${e.ch} "${e.note}" ${e.inst} ${e.vol} "${e.fx}")`).join(" ")})`);
      patterns.push(`    (pattern id: ${patterns.length} rows: ${r1 - r0}\n${body.join("\n")})`);
      order.push(patterns.length - 1);
    }
    if (this.tail) { patterns.push(`    (pattern id: ${patterns.length} rows: ${this.tail})`); order.push(patterns.length - 1); }
    const used = new Set([...this.ev.values()].map((e) => e.inst).filter(Boolean));
    const insts = this.instruments.filter(([id]) => used.has(id)).map(([id, nm, patch, vol, gain, send]) =>
      `    (instrument id: ${id} name: "${nm}" patch: (${patch}) volume: ${vol} gain: ${gain} send: ${send})`);
    for (const [id, , , , gain] of this.instruments) if (gain > 4) throw new Error(`${this.name}: instrument ${id} gain over motif's cap of 4`);
    return `(tune version: 1 name: "${this.name}" tempo: ${this.tempo} speed: ${this.speed} channels: ${this.channels}
  (bus reverb: ${this.reverb})
  (instruments
${insts.join("\n")})
  (patterns
${patterns.join("\n")})
  (order ${order.join(" ")})
  (history ("claude" "2026-10-12" ${JSON.stringify(this.history)})))
`;
  }
  write() { writeFileSync(join(OUT, `${this.name}.cts`), this.text()); console.log("wrote", this.name); }
}

// --- shared voices ---------------------------------------------------------------
const BREATH = "pipe-breath level: 0.5 width: 0.07 octave: 0.3 tone: 0.07 swell: 0.7 swell-rate: 0.09 attack: 1.5 release: 2.5 seed: 21";
// the drip, its two returns timed to an eighth at 72 bpm (0.4167 s) so they fall in time
const DRIP = "drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15";
const DRIP_BED = "drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.31 feedback: 0.55 echo-mix: 0.55 hp: 400 seed: 15";
const FM_PAD = "drone-fm level: 0.3 index: 1.4 index-wander: 0.2 index-rate: 0.1 mod: 1 breath-lo: 1 attack: 1.6 release: 3";
const LOW = "drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 0.8 release: 2.5 seed: 11";

// the bed's drone, channels 4-8, verbatim from assets/tunes/pipes-bed.cts
const bedSrc = readFileSync(join(HERE, "..", "..", "assets", "tunes", "pipes-bed.cts"), "utf8");
const DRONE_INSTS = [4, 5, 6, 7, 8].map((id) => {
  const m = new RegExp(`\\(instrument id: ${id} name: "([^"]+)" patch: \\(([^)]*)\\) volume: (\\d+) gain: ([\\d.]+) send: ([\\d.]+)\\)`).exec(bedSrc);
  if (!m) throw new Error(`pipes-bed instrument ${id} not found`);
  return [id, m[1], m[2], Number(m[3]), Number(m[4]), Number(m[5])];
});
const DRONE_NOTES = [[4, "D3", 24], [5, "A3", 22], [6, "D4", 21], [7, "F#4", 19], [8, "C5", 18]];
function droneOn(t) { for (const [ch, n, v] of DRONE_NOTES) t.ev.set(`0/${ch}`, { row: 0, ch, note: cell(n), inst: ch, vol: v, fx: "000" }); }

// ===================================================================================
// A · BREATH INTO SONG. The same materials, made to sing: the breath carries a melody
// an octave above the old one, a pitched core under it so the notes read, the pad and
// low line the other regions' moments use, drips in time.
// ===================================================================================
// scale a moment set's instrument gains (set by measured loudness: moments sit at -19 to -20 LUFS alone)
const scale = (k, insts) => insts.map(([id, nm, p, v, g, s]) => [id, nm, p, v, Math.round(g * k * 1000) / 1000, s]);
const A_INST = scale(0.53, [
  [1, "wind in a carved mouth, singing", "pipe-breath level: 0.55 width: 0.04 octave: 0.3 tone: 0.15 swell: 0.4 swell-rate: 0.09 attack: 0.5 release: 1.8 seed: 21", 34, 1.1, 0.45],
  [2, "the pipe's own note", "drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.35 release: 1.4", 26, 0.6, 0.4],
  [3, "drop with two soft returns", DRIP, 30, 0.8, 0.3],
  [4, "low line", LOW, 28, 0.6, 0.3],
  [5, "the pad", FM_PAD, 20, 0.6, 0.45],
]);
const A_THEME = "E5:8 C5:8 A4:16 G4:4 A4:4 C5:8 Bb4:8 A4:8";           // the hook, bars 1-4
const A_ANSWER = "E5:8 C5:8 A4:8 G4:4 F4:4 E4:8 F4:4 G4:4 A4:16";        // bars 5-8
function aMoment() {
  const t = new Tune("zz-pa-moment", { bars: 10, instruments: A_INST, history: "Pipes rethink sketch A, the Long Pipe: the falling breath E C A sung an octave up and answered (Am F C Gm-Am | Am F-Dm C Dm7), the breath doubled by a soft FM core, drips in time." });
  const P = [5, 6, 7];
  const H = [[0, "Am", ["A3", "C4", "E4"], "A2"], [16, "Am", ["A3", "C4", "E4"], "A2"], [32, "F", ["F3", "A3", "C4"], "F2"], [48, "C", ["G3", "C4", "E4"], "C3"],
    [64, "Gm7", ["G3", "Bb3", "F4"], "G2"], [72, "Am", ["A3", "C4", "E4"], "A2"], [80, "Am", ["A3", "C4", "E4"], "A2"], [96, "F", ["F3", "A3", "C4"], "F2"],
    [104, "Dm", ["F3", "A3", "C4"], "D3"], [112, "C", ["G3", "C4", "E4"], "C3"], [128, "Dm7", ["F3", "A3", "C4"], "D3"]];
  for (const [r, , ch, low] of H) { if (r !== 16 && r !== 80) { t.chord(r, P, ch, 5, 20); t.put(r, 4, low, 4, 28); } }
  t.line(1, 16, 1, 34, `${A_THEME} ${A_ANSWER}`);
  t.line(2, 16, 2, 22, `${A_THEME} ${A_ANSWER}`);
  for (const [r, n] of [[6, "A5"], [28, "C6"], [42, "A5"], [60, "E6"], [76, "F5"], [92, "C6"], [108, "A5"], [124, "G5"], [136, "A5"], [150, "E6"]]) t.put(r, 3, n, 3, 26);
  for (const ch of [4, 5, 6, 7]) t.off(152, ch);
  return t;
}
function aHook() {
  const t = new Tune("zz-pa-hook", { bars: 5, instruments: A_INST, history: "Pipes rethink sketch A: the hook alone." });
  t.line(1, 0, 1, 34, A_THEME); t.line(2, 0, 2, 22, A_THEME);
  t.put(10, 3, "C6", 3, 26); t.put(44, 3, "A5", 3, 24);
  return t;
}

// ===================================================================================
// B · THE STONE ORGAN. The carved pipes are an organ nobody plays; the wind sounds
// whole chords. The tune is an octave leap that falls back and stops a step short of
// D4, the note the region is hiding; at home (hollow-octave) the leap is D3 to D4.
// ===================================================================================
const B_INST = [
  [1, "the long rank", "drone-fm level: 0.3 index: 0.55 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.25 release: 1.2", 34, 0.75, 0.5],
  [2, "wind on its lip", "pipe-breath level: 0.4 width: 0.05 octave: 0.5 tone: 0.05 swell: 0.5 swell-rate: 0.12 attack: 0.3 release: 1.5 seed: 23", 24, 1.1, 0.5],
  [3, "drop with two soft returns", DRIP, 30, 0.8, 0.3],
  [4, "the ranks", "drone-fm level: 0.3 index: 0.8 index-wander: 0.1 index-rate: 0.08 mod: 1 breath-lo: 0.75 breath-rate: 0.25 attack: 1.4 release: 2.5 seed: 41", 22, 0.6, 0.5],
  [5, "pedal", LOW, 28, 0.6, 0.35],
  [6, "the octave rank", "drone-fm level: 0.3 index: 0.4 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.3 release: 1.2", 16, 0.6, 0.6],
];
const B_THEME = "A3:8 A4:8 G4:4 F4:4 E4:8 C4:16";                        // the hook, bars 1-3
const B_ANSWER = "r:16 A3:8 A4:8 Bb4:4 A4:4 G4:8 F4:4 E4:4 F4:4 G4:4 E4:8 C4:24";
function bMoment() {
  const t = new Tune("zz-pb-moment", { bars: 11, instruments: B_INST, history: "Pipes rethink sketch B, the Long Pipe: an organ chorale the wind plays (Dm C F Bb | Dm Gm F-C Am C), the tune leaping an octave and falling back to C4, a step under H4's D4, on bVII." });
  const R = [4, 5, 6];
  const H = [[0, ["F3", "A3", "F4"], "D3"], [16, ["F3", "A3", "F4"], "D3"], [32, ["G3", "C4", "E4"], "C3"], [48, ["F3", "A3", "C4"], "A2"], [64, ["F3", "Bb3", "F4"], "Bb2"],
    [80, ["F3", "A3", "F4"], "D3"], [96, ["G3", "Bb3", "G4"], "G2"], [112, ["F3", "A3", "C4"], "F2"], [120, ["G3", "C4", "E4"], "C3"], [128, ["A3", "C4", "E4"], "A2"],
    [144, ["G3", "C4", "E4"], "C3"]];
  for (const [r, ch, low] of H) { t.chord(r, R, ch, 4, 20); t.put(r, 7, low, 5, 28); }
  const tune = `${B_THEME} ${B_ANSWER}`;
  t.line(1, 16, 1, 34, tune); t.line(2, 16, 2, 22, tune); t.line(8, 16, 6, 14, tune.replace(/([A-G]b?)(\d)/g, (m, n, o) => n + (Number(o) + 1)));
  for (const [r, n] of [[8, "A5"], [62, "C6"], [74, "A5"], [100, "E6"], [140, "A5"], [160, "C6"]]) t.put(r, 3, n, 3, 26);
  for (const ch of [4, 5, 6, 7]) t.off(168, ch);
  return t;
}
function bHook() {
  const t = new Tune("zz-pb-hook", { bars: 4, instruments: B_INST, history: "Pipes rethink sketch B: the hook alone." });
  t.line(1, 0, 1, 34, B_THEME); t.line(2, 0, 2, 22, B_THEME);
  t.line(8, 0, 6, 14, B_THEME.replace(/([A-G]b?)(\d)/g, (m, n, o) => n + (Number(o) + 1)));
  t.put(36, 3, "C6", 3, 24);
  return t;
}

// ===================================================================================
// C · ECHOES. The cave answers: a pan-pipe tune, then its first and second returns a
// bar apart, quieter and further back, so it becomes a round, the way a drip comes
// back twice. The drips keep time as a slow water clock.
// ===================================================================================
const PAN = "fm4-pipe index: 1.2 attack-index: 3.0 drive: 0.2 vib-depth: 0.003 vib-delay: 0.3";
const C_INST = scale(0.56, [
  [1, "pan pipe, near", PAN, 34, 0.55, 0.35],
  [2, "pan pipe, the first return", PAN, 24, 0.55, 0.6],
  [3, "pan pipe, the second return", PAN, 17, 0.55, 0.8],
  [4, "drop with two soft returns", DRIP, 30, 0.8, 0.3],
  [5, "the pad", FM_PAD, 16, 0.6, 0.45],
  [7, "low line", LOW, 24, 0.6, 0.3],
]);
const C_THEME = "A4:4 C5:4 E5:8 D5:6 C5:2 A4:8";                          // the hook, bars 1-2
const C_TUNE = `${C_THEME} G4:4 A4:4 C5:4 E5:4 F5:8 E5:8 D5:6 C5:2 A4:4 G4:4 A4:16`;
function cMoment() {
  const t = new Tune("zz-pc-moment", { bars: 10, instruments: C_INST, history: "Pipes rethink sketch C, the Long Pipe: a pan-pipe tune in a round with its own two returns a bar apart (A C E, D C A), over Am Dm Gm F Dm Am F Am; drips as a water clock." });
  const H = [[0, ["A3", "E4"], "A2"], [16, ["A3", "E4"], "A2"], [32, ["F3", "A3"], "D3"], [48, ["G3", "Bb3"], "G2"], [64, ["F3", "A3"], "F2"],
    [80, ["F3", "A3"], "D3"], [96, ["A3", "E4"], "A2"], [112, ["F3", "C4"], "F2"], [128, ["A3", "E4"], "A2"]];
  for (const [r, ch, low] of H) { t.chord(r, [5, 6], ch, 5, 16); t.put(r, 7, low, 7, 24); }
  t.line(1, 16, 1, 34, C_TUNE); t.line(2, 32, 2, 24, C_TUNE); t.line(3, 48, 3, 17, C_TUNE);
  // the water clock: a drop on beat 1 and the "and" of 3, alternating pitch; its returns fall on eighths
  const pitches = ["A5", "E6", "C6", "A5", "F5", "C6", "E6", "A5"];
  for (let b = 0; b < 10; b++) { t.put(b * 16, 4, pitches[b % 8], 4, b < 1 ? 22 : 24); if (b < 9) t.put(b * 16 + 10, 4, pitches[(b + 3) % 8], 4, 18); }
  for (const ch of [5, 6, 7]) t.off(152, ch);
  return t;
}
function cHook() {
  const t = new Tune("zz-pc-hook", { bars: 5, instruments: C_INST, history: "Pipes rethink sketch C: the hook alone, with its two returns." });
  t.line(1, 0, 1, 34, C_THEME); t.line(2, 16, 2, 24, C_THEME); t.line(3, 32, 3, 17, C_THEME);
  t.put(0, 4, "A5", 4, 22); t.put(26, 4, "E6", 4, 18); t.put(48, 4, "C6", 4, 18);
  return t;
}

// ===================================================================================
// The beds: pipes-bed's layout (wind water pipes drone), 60 bpm at speed 15, one
// 128-row loop (80 s) after a 16-row start, drone verbatim.
// ===================================================================================
const WIND = (gain) => [1, "wind outside", "noise-bed color: pink level: 1.0 centre: 380 width: 1.2 wander: 0.3 rate: 0.06 gust: 0.5 gust-rate: 0.1 hp: 200 lp: 900 attack: 3 release: 4 seed: 18", 22, gain, 0.2];
function bed(name, history, insts, fill) {
  const t = new Tune(name, { bars: 9, rowsPerBar: 16, tempo: 60, speed: 15, instruments: [...insts, ...DRONE_INSTS], history, tail: 0 });
  t.allowD4 = true;                       // the carried drone's own H4 voice
  droneOn(t);
  t.put(0, 1, "C4", 1, 22);
  fill(t);
  t.put(143, 1, "C4", 0, 0, "B01");     // loop from row 16 (motif: jump to order 1)
  t.ev.get("143/1").note = "...";
  return t;
}
// the beds are one pattern each in text(): split start and loop by hand
function bedText(t) {
  const all = [...t.ev.values()];
  const part = (lo, hi) => {
    const rows = new Map();
    for (const e of all) if (e.row >= lo && e.row < hi) { const r = e.row - lo; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(e); }
    return [...rows.keys()].sort((a, b) => a - b).map((r) => `      (row ${r} ${rows.get(r).sort((a, b) => a.ch - b.ch).map((e) => `(${e.ch} "${e.note}" ${e.inst} ${e.vol} "${e.fx}")`).join(" ")})`).join("\n");
  };
  const used = new Set(all.map((e) => e.inst).filter(Boolean));
  const insts = t.instruments.filter(([id]) => used.has(id)).map(([id, nm, patch, vol, gain, send]) =>
    `    (instrument id: ${id} name: "${nm}" patch: (${patch}) volume: ${vol} gain: ${gain} send: ${send})`);
  return `(tune version: 1 name: "${t.name}" tempo: 60 speed: 15 channels: 8
  (bus reverb: ${t.reverb})
  (instruments
${insts.join("\n")})
  (patterns
    (pattern id: 0 rows: 16
${part(0, 16)})
    (pattern id: 1 rows: 128
${part(16, 144)}))
  (order 0 1)
  (history ("claude" "2026-10-12" ${JSON.stringify(t.history)})))
`;
}

// A: the approved bed, pitched a little more clearly and 2 dB quieter in its loudest
// rooms; its breaths stay A3 E4 C4 F4, now an octave under the moments' tune.
const aBed = bed("zz-pa-bed", "Pipes rethink sketch A: pipes-bed with a narrower, more pitched breath and less wind.", [
  WIND(1.6), [2, "drip", DRIP_BED, 30, 1.2, 0.25],
  [3, "pipe", "pipe-breath level: 0.6 width: 0.045 octave: 0.4 tone: 0.14 swell: 0.6 swell-rate: 0.09 attack: 4 release: 5 seed: 21", 27, 0.65, 0.35]], (t) => {
  t.put(0, 3, "A3", 3, 27); t.put(6, 2, "A5", 2, 30);
  // the breath: the approved A3 E4 C4 F4, at pipes-bed's times
  for (const [r, n, v] of [[36, "off"], [47, "E4", 24], [71, "off"], [86, "C4", 25], [106, "off"], [115, "F4", 20], [128, "off"], [135, "A3", 27]])
    n === "off" ? t.off(r, 3) : t.put(r, 3, n, 3, v);
  for (const [r, n, v] of [[19, "C6", 26], [28, "F5", 30], [36, "A5", 24], [47, "E6", 28], [53, "A5", 30], [64, "C6", 22], [71, "G5", 30], [78, "A5", 26],
    [86, "C6", 24], [95, "E6", 28], [106, "A5", 24], [115, "F5", 30], [122, "C6", 22], [130, "G5", 28], [138, "A5", 24]]) t.put(r, 2, n, 2, v);
});
// B: the pipe channel is a stone rank holding long notes, breathing with the wind
const bBed = bed("zz-pb-bed", "Pipes rethink sketch B: pipes-bed with the pipe channel as a slowly breathing stone rank on long notes (A3 F3 C4 E4 G3), never D4.", [
  WIND(1.6), [2, "drip", DRIP_BED, 30, 1.2, 0.25],
  [3, "a stone rank", "drone-fm level: 0.3 index: 0.6 index-wander: 0.15 index-rate: 0.05 mod: 2 breath-lo: 0.35 breath-rate: 0.06 attack: 5 release: 6 seed: 43", 26, 2.6, 0.45]], (t) => {
  t.put(0, 3, "A3", 3, 26); t.put(6, 2, "A5", 2, 30);
  for (const [r, n] of [[24, "off"], [30, "F3"], [56, "off"], [62, "C4"], [86, "off"], [92, "E4"], [116, "off"], [122, "G3"], [140, "off"]]) n === "off" ? t.off(r, 3) : t.put(r, 3, n, 3, 26);
  for (const [r, n, v] of [[19, "C6", 26], [33, "F5", 28], [47, "E6", 26], [58, "A5", 28], [71, "G5", 28], [86, "C6", 24], [99, "A5", 28], [112, "F5", 28], [126, "E6", 24], [138, "A5", 26]]) t.put(r, 2, n, 2, v);
});
// C: the water is the texture: drops in short runs that come back in time, the breath sparser
const cBed = bed("zz-pc-bed", "Pipes rethink sketch C: pipes-bed with the water as a slow clock of drops in runs of two or three, and fewer, shorter breaths.", [
  WIND(1.6), [2, "drip", DRIP, 30, 1.3, 0.3],
  [3, "pipe", "pipe-breath level: 0.6 width: 0.06 octave: 0.4 tone: 0.1 swell: 0.7 swell-rate: 0.09 attack: 3 release: 4 seed: 21", 27, 1.1, 0.35]], (t) => {
  t.put(0, 3, "A3", 3, 24); t.off(8, 3);
  for (const [r, n] of [[50, "E4"], [62, "off"], [104, "C4"], [116, "off"]]) n === "off" ? t.off(r, 3) : t.put(r, 3, n, 3, 22);
  const runs = [[4, ["A5", "C6", "E6"]], [20, ["F5", "A5"]], [34, ["C6", "A5", "E6"]], [52, ["G5", "A5"]], [66, ["A5", "C6", "E6"]], [80, ["F5", "A5", "C6"]],
    [96, ["E6", "C6"]], [110, ["A5", "C6", "E6"]], [126, ["G5", "F5"]], [136, ["A5", "E6"]]];
  for (const [r, ns] of runs) ns.forEach((n, i) => t.put(r + i, 2, n, 2, 28 - 3 * i));
});

for (const t of [aMoment(), aHook(), bMoment(), bHook(), cMoment(), cHook()]) t.write();
for (const t of [aBed, bBed, cBed]) { writeFileSync(join(OUT, `${t.name}.cts`), bedText(t)); console.log("wrote", t.name); }
