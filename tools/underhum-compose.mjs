#!/usr/bin/env node
// The Underhum's ending, composed: writes assets/tunes/the-fundamental.cts,
// the-fundamental-h7.cts and underhum-coda.cts from the score below.
//
//   node tools/underhum-compose.mjs          write the three tunes
//   node tools/underhum-compose.mjs --check  exit 1 if a written tune differs
//
// One score, two versions: every place the H7 ending differs reads `h7 ? ...`
// (harkfell-underhum-bible, "The H7 variant"), so the two cannot drift apart.
// The piece follows the bible's table ("The piece and the climb out"): a song
// in D at 72 bpm, the Hollow's homecoming as its chorus and one verse per
// region quoted from that region's moments in its own mode and timbres.
//
// Layout the director relies on ((harkfell finale)):
//   - marks calm (the fuse) theme hold rise glass pipes sky home close
//   - 4/4 sections at speed 6, 16 rows a bar, in patterns of at most 4 bars;
//     the sky verse in 12/8 at speed 8, 12 rows a bar of the same length
//     (3.33 s), one bar a pattern. The meter is 4x4, so a mark jump lands on
//     the next row that is a multiple of 16: always a barline.
//   - every section's first row sets the speed and starts or stops every
//     channel (the entry row), so a jump into it never leaves a note hanging.
//   - the fuse rings a stone bell on each beat a drone voice locks
//     (FINALE-LOCKS: beats 3, 5, 7, 9, and 11 for H7) and holds back the low
//     line until the fundamental enters on bar 4.
//
// Tuning rules (motif's bell and flute kinds ignore cents:,
// folio topics/motif-synth-kinds-ignore-cents): any F# that sustains over the
// drone is a drone-fm voice at -13.686 cents, C# at -11.731 (15 x D2), and in
// the H7 version every C is H7 itself, drone-fm at -31.174. The pads are
// drone-fm throughout so a chord can mix tuned and untuned notes in one
// timbre. Short bell and harp notes stay equal-tempered.
//
// Channels: 1 melody, 2 counter-line or canon, 3 ostinato, 4 bells,
// 5-7 the pad, 8 the low line. motif gives a channel at most 8 instruments.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// --- instruments -------------------------------------------------------------
const FM_FLUTE = "drone-fm level: 0.35 index: 0.9 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.08 release: 0.7";
const FM_BELL = "drone-fm level: 0.3 index: 1.4 index-wander: 0 mod: 3.5 breath-lo: 1 attack: 0.004 release: 2.6";
const FM_PAD = "drone-fm level: 0.3 index: 0.55 index-wander: 0.2 index-rate: 0.1 mod: 2 breath-lo: 1 attack: 1.6 release: 3";
const LOW = "drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 0.8 release: 2.5 seed: 11";
const H5C = "cents: -13.686", C15 = "cents: -11.731", H7C = "cents: -31.174";

const INSTRUMENTS = [
  [1, "glass flute", FM_FLUTE, 38, 0.5, 0.4],
  [2, "glass flute, its F# H5", `${FM_FLUTE} ${H5C}`, 38, 0.5, 0.4],
  [3, "glass flute, its C H7", `${FM_FLUTE} ${H7C}`, 38, 0.5, 0.45],
  [4, "stone bell", "fm4-bell index: 1.0 amp-decay: 3.5 amp-release: 1.5 vel-depth: 0.5", 40, 0.5, 0.45],
  [5, "stone bell, far", "fm4-bell index: 0.8 amp-decay: 3 amp-release: 1.5 vel-depth: 0.5", 26, 0.5, 0.6],
  [6, "stone bell, H5", `${FM_BELL} ${H5C}`, 34, 0.5, 0.5],
  [7, "stone bell, H7", `${FM_BELL} ${H7C}`, 34, 0.5, 0.55],
  [8, "the pad", FM_PAD, 22, 0.5, 0.45],
  [9, "the pad, its F# H5", `${FM_PAD} ${H5C}`, 22, 0.5, 0.45],
  [10, "the pad, its C# (15 x D2)", `${FM_PAD} ${C15}`, 22, 0.5, 0.45],
  [11, "the pad, its C H7", `${FM_PAD} ${H7C}`, 22, 0.5, 0.45],
  [12, "low line", LOW, 30, 0.5, 0.3],
  // Reedfen (first-open-water, drowned-bell)
  [13, "reed flute", "flute-wind attack: 0.12 release: 0.6 noise-amp: 0.18", 40, 0.5, 0.35],
  [14, "frog-bell", "karplus-strong decay: 1.4 excite-gain: 0.6", 26, 0.5, 0.3],
  [15, "the drowned bell", "fm4-bell index: 1.2 amp-decay: 4.5 amp-release: 2 vel-depth: 0.5", 40, 0.5, 0.5],
  // Glasswood (the-ice-rings, singing-ice)
  [16, "icicle", "fm4-bell index: 1.3 amp-decay: 2.6 amp-release: 1.2 vel-depth: 0.4", 30, 0.5, 0.55],
  [17, "ice bell", "fm4-bell index: 0.9 amp-decay: 3.5 amp-release: 1.5 vel-depth: 0.4", 36, 0.5, 0.45],
  // the Pipes (the-pipes-breathe)
  [18, "wind in a carved mouth", "pipe-breath level: 0.5 width: 0.07 octave: 0.3 tone: 0.07 swell: 0.7 swell-rate: 0.09 attack: 1.5 release: 2.5 seed: 21", 30, 0.6, 0.4],
  [19, "drop with two soft returns", "drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.31 feedback: 0.55 echo-mix: 0.55 hp: 400 seed: 15", 30, 0.55, 0.25],
  // Cloudstair (thermals, the-last-grass)
  [20, "seed harp, circling", "karplus-strong decay: 1.4 excite-gain: 0.5", 24, 0.55, 0.4],
  [21, "first flute", "flute-wind attack: 0.12 release: 0.7 noise-amp: 0.15", 38, 0.5, 0.4, -0.2],
  [22, "second flute", "flute-wind attack: 0.15 release: 0.8 noise-amp: 0.18", 28, 0.5, 0.5, 0.25],
];

// --- notes -------------------------------------------------------------------
const FLATS = { Bb: "A#", Eb: "D#", Ab: "G#", Db: "C#", Gb: "F#" };
function cell(n) {            // "D5" "F#4" "Bb3" -> "D-5" "F#4" "A#3"
  const m = /^([A-G][b#]?)(\d)$/.exec(n);
  if (!m) throw new Error(`bad note ${n}`);
  let name = FLATS[m[1]] || m[1];
  return name.length === 1 ? `${name}-${m[2]}` : `${name}${m[2]}`;
}
const pc = (n) => { const m = /^([A-G][b#]?)/.exec(n); return FLATS[m[1]] || m[1]; };

// The voice for a sustained note on the glass flute or the pad.
const flute = (n, h7) => pc(n) === "F#" ? 2 : (h7 && pc(n) === "C") ? 3 : 1;
const padInst = (n, h7) => pc(n) === "F#" ? 9 : pc(n) === "C#" ? 10 : (h7 && pc(n) === "C") ? 11 : 8;
const bellInst = (n, h7) => pc(n) === "F#" ? 6 : (h7 && pc(n) === "C") ? 7 : 4;

// --- a section: events at (row, ch) ---------------------------------------------
class Section {
  constructor(mark, bars, rowsPerBar = 16, speed = 6) {
    Object.assign(this, { mark, bars, rowsPerBar, speed, ev: new Map() });
  }
  get rows() { return this.bars * this.rowsPerBar; }
  put(row, ch, note, inst, vol, soft = false) {
    if (row < 0 || row >= this.rows) throw new Error(`${this.mark}: row ${row} outside ${this.rows}`);
    const k = `${row}/${ch}`;
    // a note may take the place of the note-off that ended the line before it
    // (soft); anything else twice on one cell is a mistake in the score
    const had = this.ev.get(k);
    if (had && !(had.soft && note !== "off")) throw new Error(`${this.mark}: two events at row ${row} channel ${ch}`);
    if (had && note === "off") return;
    this.ev.set(k, { row, ch, note: note === "off" ? "===" : cell(note), inst: note === "off" ? 0 : inst, vol: note === "off" ? 0 : vol, soft });
  }
  off(row, ch, soft = false) { this.put(row, ch, "off", 0, 0, soft); }
  // a line: "D5:4 E5:2 r:2 F#5:8" (durations in rows); legato unless r
  line(ch, row, voice, vol, spec, { offAtEnd = true } = {}) {
    for (const tok of spec.trim().split(/\s+/)) {
      const [n, d] = tok.split(":"); const dur = Number(d);
      if (n === "r") { if (!this.ev.has(`${row}/${ch}`)) this.off(row, ch); }
      else this.put(row, ch, n, typeof voice === "function" ? voice(n) : voice, vol);
      row += dur;
    }
    if (offAtEnd && row < this.rows && !this.ev.has(`${row}/${ch}`)) this.off(row, ch, true);
    return row;
  }
  // a bell: a drone-fm bell (6, 7) holds like a pad, so it gets a note-off
  // right after its attack and its release is the decay; an fm4-bell decays
  // by itself, and an off would cut it to its release
  strike(row, ch, note, inst, vol) {
    this.put(row, ch, note, inst, vol);
    if ((inst === 6 || inst === 7) && row + 1 < this.rows && !this.ev.has(`${row + 1}/${ch}`)) this.off(row + 1, ch);
  }
  chord(row, notes, h7, vol = 22) {
    notes.forEach((n, i) => this.put(row, 5 + i, n, padInst(n, h7), vol));
  }
  low(row, note, vol = 30) { this.put(row, 8, note, 12, vol); }
}

// --- the score -----------------------------------------------------------------
function score(h7) {
  const S = [];

  // FUSE (calm), 7 bars, 23.3 s. The drone's voices lock onto one breath one
  // every two beats (the director, (harkfell finale)); a stone bell rings up
  // the series as each locks: D4 A4 D5 F#5 (H2..H5's own upper notes), and C6
  // for H7. The fundamental enters on bar 4 (the drone tune), and the chord
  // swells with it: the stone turns white.
  {
    const s = new Section("calm", 7); S.push(s);
    s.strike(12, 4, "D4", 4, 34);
    s.strike(20, 4, "A4", 4, 36);
    s.strike(28, 4, "D5", 4, 38);
    s.strike(36, 4, "F#5", 6, 36);
    if (h7) s.strike(44, 4, "C6", 7, 32);
    // the fundamental arrives: the full chord rises with it
    s.chord(48, h7 ? ["D4", "F#4", "C5"] : ["D4", "F#4", "A4"], h7, 18);
    s.low(48, "D3", 26);
    s.strike(52, 3, "A5", 5, 26);
    s.strike(56, 3, "D6", 5, 22);
    s.strike(64, 4, "A5", 4, 30);
    s.strike(72, 3, "F#5", 5, 22);
    s.strike(80, 4, "D5", 4, 32);
    s.chord(80, h7 ? ["D4", "A4", "C5"] : ["D4", "A4", "E5"], h7, 20);
    s.strike(92, 3, "E5", 5, 20);
    s.chord(96, h7 ? ["D4", "F#4", "C5"] : ["D4", "F#4", "A4"], h7, 22);
    s.strike(96, 4, "A4", 4, 30);
    s.strike(104, 3, "D5", 5, 22);
  }

  // THEME, 9 bars, 30 s: the way home (hollow-answers ch1), the flute of the
  // first homecoming, now over the fused drone and the fundamental. Twice:
  // alone, then with a counter-line a third below and the far bells.
  const way = (s, at, ch, vol, voice, octave = 0, last = 12) => {
    // hollow-answers rows 24..84, its melody: F#5 G5 A5 . F#5 E5 D5 . F#5 E5 D5 E5 C#5 D5
    const up = (n) => octave ? n.replace(/\d/, (d) => String(Number(d) + octave)) : n;
    return s.line(ch, at, (n) => voice(up(n)), vol,
      ["F#5:6", "G5:2", "A5:8", "F#5:4", "E5:4", "D5:6", "F#5:2", "E5:4", "D5:4", "E5:6", "C#5:2", `D5:${last}`]
        .map((t) => { const [n, d] = t.split(":"); return `${up(n)}:${d}`; }).join(" "));
  };
  const wayChords = (s, at, vol = 22) => {
    // under the melody's offsets 0 16 24 32 40 48: G/D, D, Bm, G, A, D
    s.chord(at, ["D4", "G4", "B4"], h7, vol); s.low(at, "G2");
    s.chord(at + 16, ["D4", "F#4", "A4"], h7, vol); s.low(at + 16, "D3");
    s.chord(at + 24, ["B3", "D4", "F#4"], h7, vol); s.low(at + 24, "B2");
    s.chord(at + 32, ["B3", "D4", "G4"], h7, vol); s.low(at + 32, "G2");
    s.chord(at + 40, ["C#4", "E4", "A4"], h7, vol); s.low(at + 40, "A2");
    s.chord(at + 48, h7 ? ["D4", "F#4", "C5"] : ["D4", "F#4", "A4"], h7, vol); s.low(at + 48, "D3");
  };
  {
    const s = new Section("theme", 9); S.push(s);
    s.chord(0, ["D4", "F#4", "A4"], h7, 22); s.low(0, "D3");
    s.strike(0, 4, "D5", 4, 34);
    s.strike(8, 4, "A4", 4, 28);
    wayChords(s, 16);
    way(s, 16, 1, 38, (n) => flute(n, h7));
    s.strike(52, 3, "A4", 5, 22);
    s.strike(68, 3, "B4", 5, 20);
    // second pass, a bar later, with the counter-line a third below
    wayChords(s, 80, 24);
    way(s, 80, 1, 40, (n) => flute(n, h7));
    s.line(2, 80, (n) => flute(n, h7), 30,
      "D5:6 E5:2 F#5:8 D5:4 C#5:4 B4:6 D5:2 C#5:4 B4:4 C#5:6 A4:2 A4:12");
    s.strike(84, 3, "A5", 5, 22);
    s.strike(100, 3, "E5", 5, 20);
    s.strike(116, 3, "E5", 5, 20);
    // the stones answer up the series as the phrase lands
    s.strike(128, 4, "D5", 4, 32);
    s.strike(132, 4, "F#5", 6, 30);
    s.strike(136, 4, "A5", 4, 30);
    if (h7) s.strike(140, 4, "C6", 7, 28);
  }

  // HOLD, 4 bars, loops until the climb: the chamber, quiet. An open chord
  // and the stones, sparse.
  {
    const s = new Section("hold", 4); S.push(s);
    s.chord(0, h7 ? ["D4", "F#4", "C5"] : ["D4", "E4", "A4"], h7, 18); s.low(0, "D3", 22);
    s.strike(0, 4, "D5", 4, 26);
    s.strike(8, 3, "A5", 5, 18);
    s.strike(24, 4, "A4", 4, 22);
    s.strike(32, 3, "D6", 5, 16);
    s.strike(40, 4, "F#5", 6, 22);
    s.strike(56, 4, h7 ? "C5" : "E5", h7 ? 7 : 4, 20);
  }

  // RISE: verse 1, Reedfen, D Dorian, 6 bars, 20 s, from the chamber floor up
  // the column. The drowned bell rings once, low, as you leave the floor; the
  // frog-bell ostinato (first-open-water ch2) under the reed flute's line
  // (ch1), over Dm, G, Dm, G, F, C. The director thins H5 here (F natural).
  {
    const s = new Section("rise", 6); S.push(s);
    s.put(0, 4, "D4", 15, 40);
    const frog = [["D5", "A5", "F5", "A5"], ["D5", "B5", "G5", "B5"], ["D5", "A5", "F5", "A5"],
                  ["D5", "B5", "G5", "B5"], ["C5", "A5", "F5", "A5"], ["C5", "G5", "E5", "G5"]];
    frog.forEach((bar, b) => bar.forEach((n, i) => s.put(b * 16 + i * 4, 3, n, 14, i === 0 ? 30 : i === 2 ? 26 : 22)));
    const pads = [["D4", "F4", "A4"], ["D4", "G4", "B4"], ["D4", "F4", "A4"], ["D4", "G4", "B4"], ["C4", "F4", "A4"], ["C4", "E4", "G4"]];
    const lows = ["D3", "G2", "D3", "G2", "F2", "C3"];
    pads.forEach((p, b) => { s.chord(b * 16, p, h7, 20); s.low(b * 16, lows[b], 30); });
    s.put(4, 1, "A4", 13, 40);
    s.line(1, 16, 13, 42, "B4:6 D5:6 E5:4 F5:8 E5:4 D5:4 B4:8 A4:4 G4:4 A4:6 C5:6 F5:4 E5:8 D5:4 C5:4");
  }

  // GLASS: verse 2, Glasswood, D Lydian, 6 bars, 20 s: up the Ringing Stair
  // and into the gallery. The icicles climb over the D pedal (the-ice-rings
  // ch1, D6 F#6 A6 C#7 / E6 G#6 B6 D7) with the ice bell's line (its ch3),
  // then the singing ice's chorale leans on G# and resolves to A.
  {
    const s = new Section("glass", 6); S.push(s);
    const ice = [["D6", "F#6", "A6", "C#7", "A6", "F#6", "E6", "A6"], ["E6", "G#6", "B6", "D7", "B6", "G#6", "F#6", "B6"],
                 ["D6", "F#6", "A6", "C#7", "E7", "C#7", "A6", "F#6"], ["E6", "G#6", "B6", "D7", "F#7", "D7", "B6", "G#6"]];
    ice.forEach((bar, b) => bar.forEach((n, i) => s.put(b * 16 + i * 2, 3, n, 16, i % 4 === 0 ? 28 : 20)));
    s.line(2, 0, 17, 34, "A5:16 G#5:8 B5:8 A5:8 F#5:8 E5:8 G#5:8", { offAtEnd: false });
    const pads = [["D5", "F#5", "A5"], ["E5", "G#5", "B5"], ["D5", "F#5", "A5"], ["E5", "G#5", "B5"]];
    pads.forEach((p, b) => s.chord(b * 16, p, h7, 18));
    s.low(0, "D3", 28);
    // the chorale: the lean on G#, resolving to A
    s.chord(64, ["D5", "F#5", "A5"], h7, 20);
    s.chord(72, ["E5", "G#5", "B5"], h7, 20);
    s.chord(80, ["D5", "F#5", "A5"], h7, 22);
    s.line(1, 64, 17, 38, "F#6:4 E6:4 G#6:4 B6:4 A6:12");
    s.off(64, 2); s.off(64, 3);
    s.put(88, 3, "A7", 16, 14);
  }

  // PIPES: verse 3, D Aeolian, 5 bars, 16.7 s: the song's one dark turn, and
  // its quietest. The falling breath through a carved mouth (the-pipes-breathe
  // ch1, E4 C4 A3) and a drip with two soft returns, B-flat in the pad; the
  // director thins the drone to H4 and the fundamental. No low line.
  // (The Pipes moments are being rewritten in refinement pass 3; if that
  // lands first, this verse quotes the new hook instead.)
  {
    const s = new Section("pipes", 5); S.push(s);
    s.off(0, 8);
    s.line(1, 0, 18, 28, "E4:14 r:6 C4:14 r:6 A3:16 r:8 D4:16");
    s.put(9, 3, "C6", 19, 22);
    s.put(45, 3, "A5", 19, 20);
    s.put(70, 3, "D6", 19, 16);
    s.chord(0, ["D4", "F4", "A4"], h7, 16);
    s.chord(32, ["D4", "F4", "Bb4"], h7, 16);
    s.chord(64, ["D4", "E4", "A4"], h7, 16);
  }

  // SKY: verse 4, Cloudstair, D Mixolydian in 12/8, 6 bars, 20 s, repeating
  // while you climb. The seed harp circles each chord (thermals ch1); two
  // flutes in canon a fourth apart, a bar behind (thermals' canon); and at the
  // top the last grass's call rises to C, the flat seventh (the-last-grass
  // ch1: D5 E5 G5 A5 C6). In the H7 version that C is H7 itself. F# sounds
  // freely here for the first time in Cloudstair's music.
  {
    const harp = [["D5", "A5", "D6", "E6", "D6", "A5", "C5", "G5", "C6", "E6", "C6", "G5"],
                  ["B4", "G5", "B5", "D6", "B5", "G5", "D5", "A5", "D6", "E6", "D6", "A5"],
                  ["D5", "A5", "D6", "E6", "D6", "A5", "C5", "G5", "C6", "E6", "C6", "G5"],
                  ["B4", "G5", "B5", "D6", "B5", "G5", "A4", "E5", "A5", "C6", "A5", "E5"],
                  ["C5", "G5", "C6", "E6", "C6", "G5", "D5", "A5", "D6", "F#6", "D6", "A5"],
                  ["D5", "A5", "D6", "F#6", "D6", "A5", "C5", "G5", "C6", "E6", "C6", "G5"]];
    const chords = [[["D4", "F#4", "A4"], ["C4", "E4", "G4"]], [["B3", "D4", "G4"], ["D4", "F#4", "A4"]],
                    [["D4", "F#4", "A4"], ["C4", "E4", "G4"]], [["B3", "D4", "G4"], ["A3", "C4", "E4"]],
                    [["C4", "E4", "G4"], ["D4", "F#4", "A4"]], [["D4", "F#4", "A4"], ["C4", "E4", "G4"]]];
    const lows = [["D3", "C3"], ["G2", "D3"], ["D3", "C3"], ["G2", "A2"], ["C3", "D3"], ["D3", "C3"]];
    // the first flute's line, in eighths of the 6-bar verse (72 eighths)
    const tune1 = [[6, "A5", 3], [9, "D6", 2], [11, "C6", 1], [12, "G5", 3], [15, "E5", 3], [18, "D5", 3],
                   [21, "G5", 2], [23, "A5", 1], [24, "A5", 6], [30, "D6", 3], [33, "E6", 2], [35, "D6", 1],
                   [36, "C6", 3], [39, "G5", 3], [42, "B5", 3], [45, "A5", 2], [47, "G5", 1], [48, "E5", 6]];
    const down4 = { A5: "E5", D6: "A5", C6: "G5", G5: "D5", E5: "B4", D5: "A4", E6: "B5", B5: "F#5" };
    const call = [[60, "D5", 1], [61, "E5", 1], [62, "G5", 3], [65, "A5", 1], [66, "C6", 6]];
    for (let b = 0; b < 6; b++) {
      const s = new Section(b === 0 ? "sky" : `sky${b + 1}`, 1, 12, 8); S.push(s);
      harp[b].forEach((n, i) => s.put(i, 3, n, 20, i % 6 === 0 ? 24 : 18));
      chords[b].forEach((c, k) => { s.chord(k * 6, c, h7, 18); s.low(k * 6, lows[b][k], 26); });
      const lay = (ch, list, voice, vol, shift = 0) => {
        const starts = new Set(list.map(([at]) => at + shift));
        for (const [at, n, d] of list) {
          const e = at + shift;
          if (e >= b * 12 && e < b * 12 + 12) {
            const r = e - b * 12;
            s.put(r, ch, n, typeof voice === "function" ? voice(n) : voice, vol);
            if (r + d < 12 && !starts.has(e + d)) s.off(r + d, ch);
          }
        }
      };
      lay(1, tune1, 21, 40);
      lay(2, tune1.map(([at, n, d]) => [at, down4[n] || n, d]), 22, 30, 12);
      // the call, on the glass flute so its C can be H7 in the H7 version
      lay(1, call, (n) => (h7 && pc(n) === "C") ? 3 : 21, 44);
    }
  }

  // HOME, 15 bars, 50 s: the second chorus, entering the bowl at night. The
  // way home over every region at once (frog bells, icicles, seed harp, the
  // pipes' breath, the stones); then the Tops' high flute rising over the sky
  // (high-fell ch1) as the climax; then the third's homecoming close (hollow-
  // third ch1), G to D, the glass flute rising to F#5: the major third and the
  // fundamental at full together. In the H7 version every D chord carries the
  // seventh, and it is never resolved.
  {
    const s = new Section("home", 15); S.push(s);
    const D = h7 ? ["D4", "F#4", "C5"] : ["D4", "F#4", "A4"];
    s.chord(0, D, h7, 24); s.low(0, "D3", 32);
    s.strike(0, 4, "D5", 4, 36);
    wayChords(s, 8, 24);
    way(s, 8, 1, 42, (n) => flute(n, h7), 0, 8);
    // every region under it: frog bells, icicles, the seed harp, the drips
    ["D5", "B5", "G5", "B5"].forEach((n, i) => s.put(8 + i * 4, 3, n, 14, 22));
    ["D6", "F#6", "A6", "C#7", "A6", "F#6", "E6", "A6"].forEach((n, i) => s.put(24 + i * 2, 3, n, 16, 18));
    ["B4", "F#5", "B5", "D6", "B5", "F#5", "B4", "G5", "B5", "D6", "B5", "G5"].forEach((n, i) => s.put(40 + i * 2, 3, n, 20, 18));
    s.line(2, 8, 18, 22, "A3:16 D4:24 r:2 A3:14");
    s.strike(24, 4, "A4", 4, 26);
    s.strike(40, 4, "F#5", 6, 28);
    s.strike(56, 4, "A5", 4, 28);
    // the climax: the Tops' high flute, an octave of open sky under it
    const climax = [["D4", "A4", "E5"], ["B3", "F#4", "D5"], ["G3", "D4", "F#4"], ["A3", "E4", "B4"]];
    const climaxLow = ["D3", "B2", "G2", "A2"];
    climax.forEach((c, k) => { s.chord(64 + k * 16, c, h7, 24); s.low(64 + k * 16, climaxLow[k], 30); });
    s.line(1, 64, (n) => flute(n, h7), 44, "A5:4 B5:2 D6:6 B5:2 A5:2 F#5:8 E5:2 F#5:2 A5:8 B5:2 D6:4 E6:6 D6:2 B5:2 A5:12");
    [0, 2, 4, 6, 8, 10].forEach((r, i) => s.put(64 + r, 3, ["D6", "A6", "E7", "A6", "D7", "A6"][i], 16, 14));
    s.strike(72, 4, "D6", 5, 20);
    s.strike(84, 4, "A5", 5, 18);
    s.strike(106, 4, "F#6", 6, 18);
    s.strike(124, 4, "E6", 4, 22);
    // the homecoming close: G to D, the flute rising to F#5
    s.chord(128, D, h7, 24); s.low(128, "D3", 32);
    s.off(128, 3);
    s.line(1, 136, (n) => flute(n, h7), 40,
      "F#5:8 E5:4 D5:4 G5:4 B5:8 B5:4 G5:4 E5:8 G5:8 F#5:4 E5:4 D5:4 E5:4 F#5:24");
    s.chord(152, ["G4", "B4", "D5"], h7, 24); s.low(152, "G2", 30);
    s.chord(168, ["E4", "G4", "B4"], h7, 24); s.low(168, "B2", 30);
    s.chord(184, ["G4", "B4", "D5"], h7, 24); s.low(184, "G2", 30);
    s.chord(200, D, h7, 26); s.low(200, "D3", 32);
    s.strike(160, 4, "D6", 5, 20);
    s.strike(176, 4, "B5", 5, 18);
    // the stones ring D and F# together as the third lands (hollow-third)
    s.strike(208, 4, "F#6", 6, 30);
    s.put(208, 3, "D6", 4, 30);
    if (h7) s.line(2, 216, 3, 30, "C5:24");
  }

  // CLOSE, 15 bars (16 with H7), under the credits: the stones' slow bell line
  // (stones-remember ch1) over the fused chord; then the pad and the line let
  // go, and the drone's voices leave on their own (the director, H5 H4 H3
  // H2, the card's reverse order) until the fundamental is alone, or H7.
  {
    const s = new Section("close", h7 ? 16 : 15); S.push(s);
    const D = h7 ? ["D4", "F#4", "C5"] : ["D4", "F#4", "A4"];
    const bells = [[0, "D5"], [8, "A4"], [16, "F#5"], [24, "E5"], [28, "D5"], [32, "B4"], [40, "D5"],
                   [48, "C#5"], [56, "E5"], [64, "D5"], [72, "B4"], [76, "G4"], [80, "A4"], [88, "D5"]];
    for (const [r, n] of bells) {
      if (pc(n) === "F#" || pc(n) === "C#") s.strike(r, 4, n, pc(n) === "F#" ? 6 : 4, 36);
      else s.put(r, 4, n, 4, r === 0 || r === 88 ? 40 : 34);
    }
    s.chord(0, D, h7, 22); s.low(0, "D3", 28);
    s.chord(16, ["B3", "D4", "F#4"], h7, 22); s.low(16, "B2", 26);
    s.chord(32, ["B3", "D4", "G4"], h7, 22); s.low(32, "G2", 26);
    s.chord(48, ["C#4", "E4", "A4"], h7, 22); s.low(48, "A2", 26);
    s.chord(64, ["B3", "D4", "G4"], h7, 22); s.low(64, "G2", 26);
    s.chord(80, D, h7, 22); s.low(80, "D3", 26);
    s.off(0, 1); s.off(0, 2); s.off(0, 3);
    // let go: the pad and the low line leave as the drone's voices do
    s.off(128, 5); s.off(132, 6); s.off(136, 7); s.off(140, 8);
    s.strike(112, 3, "A5", 5, 18);
    s.strike(152, 3, "D6", 5, 14);
    if (h7) s.strike(200, 3, "C6", 7, 16);
  }
  return S;
}

// The late finders' coda: about 30 s, played once in the chamber when H7
// comes after the ending. The stone bells ring up the series to the fifth
// notch, H7, over the fused chord; the glass flute falls to C, H7, and is
// left there: the hanging close.
function coda() {
  const S = [];
  const s = new Section("calm", 9); S.push(s);
  s.strike(0, 4, "D4", 4, 32);
  s.strike(8, 4, "A4", 4, 34);
  s.strike(16, 4, "D5", 4, 36);
  s.strike(24, 4, "F#5", 6, 34);
  s.strike(32, 4, "C6", 7, 34);
  s.chord(32, ["D4", "F#4", "C5"], true, 20); s.low(32, "D3", 26);
  s.line(1, 48, (n) => flute(n, true), 38, "A5:8 F#5:4 E5:4 D5:8 E5:4 F#5:4 E5:8 C5:40");
  s.strike(64, 3, "A5", 5, 20);
  s.strike(96, 3, "C6", 7, 18);
  s.off(112, 5); s.off(116, 6); s.off(120, 7); s.off(124, 8);
  return S;
}

// --- writing -------------------------------------------------------------------
function render(name, sections, { channels = 8, history, marks = true }) {
  const patterns = [], order = [], markPos = [];
  for (const sec of sections) {
    const isMark = !/\d$/.test(sec.mark);
    if (isMark && marks) markPos.push([sec.mark, order.length]);
    // entry row: every channel starts or stops at a section that can be jumped to
    if (isMark) for (let ch = 1; ch <= channels; ch++) if (!sec.ev.has(`0/${ch}`)) sec.off(0, ch);
    for (let b0 = 0; b0 < sec.bars; b0 += (sec.rowsPerBar === 16 ? 4 : 1)) {
      const nb = Math.min(sec.rowsPerBar === 16 ? 4 : 1, sec.bars - b0);
      const r0 = b0 * sec.rowsPerBar, r1 = r0 + nb * sec.rowsPerBar;
      const rows = new Map();
      for (const e of sec.ev.values()) if (e.row >= r0 && e.row < r1) {
        const r = e.row - r0; if (!rows.has(r)) rows.set(r, []); rows.get(r).push(e);
      }
      // the speed, on row 0 of every pattern (a jump or a loop may land here)
      if (!rows.has(0)) rows.set(0, []);
      const r0cells = rows.get(0);
      const fx = `F0${sec.speed}`;
      const host = r0cells.find((e) => e.ch === 8) || r0cells[0];
      if (host) host.fx = fx; else r0cells.push({ row: r0, ch: 8, note: "...", inst: 0, vol: 0, fx });
      const id = patterns.length;
      const body = [...rows.keys()].sort((a, b) => a - b).map((r) => {
        const cs = rows.get(r).sort((a, b) => a.ch - b.ch)
          .map((e) => `(${e.ch} "${e.note}" ${e.inst} ${e.vol} "${e.fx || "000"}")`).join(" ");
        return `      (row ${r} ${cs})`;
      });
      patterns.push(`    (pattern id: ${id} rows: ${nb * sec.rowsPerBar}\n${body.join("\n")})`);
      order.push(id);
    }
  }
  // a silent pattern after the last row so the bells and the reverb ring out
  patterns.push(`    (pattern id: ${patterns.length} rows: 29)`);
  order.push(patterns.length - 1);
  const used = new Set();
  for (const sec of sections) for (const e of sec.ev.values()) if (e.inst) used.add(e.inst);
  const insts = INSTRUMENTS.filter(([id]) => used.has(id)).map(([id, nm, patch, vol, gain, send, pan]) =>
    `    (instrument id: ${id} name: "${nm}" patch: (${patch}) volume: ${vol} gain: ${gain} send: ${send}${pan !== undefined ? ` pan: ${pan}` : ""})`);
  // motif: at most 8 instruments a channel
  for (let ch = 1; ch <= channels; ch++) {
    const set = new Set();
    for (const sec of sections) for (const e of sec.ev.values()) if (e.ch === ch && e.inst) set.add(e.inst);
    if (set.size > 8) throw new Error(`${name}: channel ${ch} uses ${set.size} instruments (motif allows 8)`);
  }
  const markText = markPos.length ? `\n  (marks ${markPos.map(([m, p]) => `${m}: ${p}`).join(" ")})` : "";
  return `(tune version: 1 name: "${name}" tempo: 72 speed: 6 channels: ${channels}
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.3)
  (instruments
${insts.join("\n")})
  (patterns
${patterns.join("\n")})
  (order ${order.join(" ")})${markText}
  (history ("claude" "2026-10-12" ${JSON.stringify(history)})))
`;
}

const HISTORY = "Underhum SOUND: the finale, one song in D at 72 bpm made of the world's moments (David, 2026-10-11). The fuse rings the stone bells up the series as each drone voice locks; the way home (hollow-answers) is the chorus; four verses quote Reedfen (Dorian), Glasswood (Lydian), the Pipes (Aeolian) and Cloudstair (Mixolydian, 12/8) in the order the climb passes them; home brings every region under the chorus, the Tops' flute, and the third's homecoming; close is the stones' bell line under the credits. Written by tools/underhum-compose.mjs; edit the score there.";
const out = [
  ["the-fundamental", render("the-fundamental", score(false), { history: HISTORY })],
  ["the-fundamental-h7", render("the-fundamental-h7", score(true), { history: HISTORY + " The H7 version: H7's C in every D chord from the fuse on, the last grass's call rising to H7, never resolved; in close H7 is the voice left." })],
  ["underhum-coda", render("underhum-coda", coda(), { marks: false, history: "Underhum SOUND: the late finders' coda (harkfell-underhum-bible, The H7 variant). Played once in the chamber when H7 is carried after the ending: the stone bells ring up the series to H7's notch over the fused chord, and the glass flute falls to C, H7, and is left hanging. Written by tools/underhum-compose.mjs." })],
];
let bad = 0;
for (const [name, text] of out) {
  const path = join(ROOT, "assets/tunes", `${name}.cts`);
  if (CHECK) {
    const now = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (now !== text) { console.log(`DIFFERS ${name}`); bad++; } else console.log(`same ${name}`);
  } else { writeFileSync(path, text); console.log(`wrote ${name} (${text.length} bytes)`); }
}
process.exit(bad ? 1 : 0);
