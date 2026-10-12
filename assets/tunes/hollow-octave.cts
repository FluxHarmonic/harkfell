(tune version: 1 name: "hollow-octave" tempo: 72 speed: 6 channels: 8
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the long rank" patch: (drone-fm level: 0.3 index: 1.3 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.25 release: 1.2) volume: 34 gain: 0.75 send: 0.5)
    (instrument id: 2 name: "wind on its lip" patch: (pipe-breath level: 0.4 width: 0.05 octave: 0.9 tone: 0.05 swell: 0.5 swell-rate: 0.12 attack: 0.3 release: 1.5 seed: 23) volume: 24 gain: 1.1 send: 0.5)
    (instrument id: 4 name: "the ranks" patch: (drone-fm level: 0.3 index: 1.4 index-wander: 0.2 index-rate: 0.1 mod: 1 breath-lo: 0.75 breath-rate: 0.25 attack: 1.4 release: 2.5 seed: 41) volume: 22 gain: 0.6 send: 0.5)
    (instrument id: 5 name: "pedal" patch: (drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 0.8 release: 2.5 seed: 11) volume: 28 gain: 0.6 send: 0.35)
    (instrument id: 6 name: "the octave rank" patch: (drone-fm level: 0.3 index: 0.4 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.3 release: 1.2) volume: 16 gain: 0.6 send: 0.6)
    (instrument id: 7 name: "stone bell" patch: (fm4-bell index: 1.0 amp-decay: 3.5 amp-release: 1.5 vel-depth: 0.5) volume: 40 gain: 0.54 send: 0.45))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (3 "D-4" 7 34 "000") (7 "D-3" 5 26 "000"))
      (row 6 (3 "D-5" 7 30 "000"))
      (row 12 (3 "D-6" 7 26 "000"))
      (row 16 (1 "D-3" 1 34 "000") (2 "D-3" 2 22 "000") (4 "F-3" 4 20 "000") (5 "D-4" 4 20 "000") (6 "F-4" 4 20 "000") (7 "D-3" 5 28 "000") (8 "D-4" 6 14 "000"))
      (row 24 (1 "D-4" 1 34 "000") (2 "D-4" 2 22 "000") (8 "D-5" 6 14 "000"))
      (row 32 (1 "C-4" 1 34 "000") (2 "C-4" 2 22 "000") (4 "F-3" 4 20 "000") (5 "A#3" 4 20 "000") (6 "D-4" 4 20 "000") (7 "A#2" 5 28 "000") (8 "C-5" 6 14 "000"))
      (row 36 (1 "A#3" 1 34 "000") (2 "A#3" 2 22 "000") (8 "A#4" 6 14 "000"))
      (row 40 (1 "G-3" 1 34 "000") (2 "G-3" 2 22 "000") (8 "G-4" 6 14 "000"))
      (row 48 (1 "A#3" 1 34 "000") (2 "A#3" 2 22 "000") (4 "G-3" 4 20 "000") (5 "A#3" 4 20 "000") (6 "D-4" 4 20 "000") (7 "G-2" 5 28 "000") (8 "A#4" 6 14 "000"))
      (row 56 (1 "C-4" 1 34 "000") (2 "C-4" 2 22 "000") (4 "G-3" 4 20 "000") (5 "C-4" 4 20 "000") (6 "E-4" 4 20 "000") (7 "C-3" 5 28 "000") (8 "C-5" 6 14 "000")))
    (pattern id: 1 rows: 64
      (row 0 (1 "D-4" 1 34 "000") (2 "D-4" 2 22 "000") (3 "D-5" 7 32 "000") (4 "F-3" 4 22 "000") (5 "D-4" 4 22 "000") (6 "F-4" 4 22 "000") (7 "D-3" 5 28 "000") (8 "D-5" 6 14 "000"))
      (row 8 (3 "D-6" 7 26 "000"))
      (row 32 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (4 "F-3" 4 18 "000") (5 "D-4" 4 18 "000") (6 "F-4" 4 18 "000") (7 "D-3" 5 28 "000") (8 "===" 0 0 "000"))
      (row 40 (3 "D-4" 7 30 "000")))
    (pattern id: 2 rows: 32
      (row 16 (4 "===" 0 0 "000") (5 "===" 0 0 "000") (6 "===" 0 0 "000") (7 "===" 0 0 "000")))
    (pattern id: 3 rows: 29))
  (order 0 1 2 3)
  (history ("claude" "2026-10-12" "Pipes SOUND (D53, the stone organ): the bowl's fixed moment for the H4 homecoming (first visit carrying 4, after hollow-answers and hollow-fifth). The Pipes' tune made on D: D3 leaps to D4, falls C4 B-flat3 G3, and climbs B-flat3 C4 to land on D4 at last, over Dm, B-flat, Gm, C, Dm; the stone bells ring H4's partials, D4 D5 D6. No A and no F#: a player may bring H4 home without H3 or H5. Written by tools/pipes-compose.mjs; edit the score there.")))
