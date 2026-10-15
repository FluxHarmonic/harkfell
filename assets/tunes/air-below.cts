(tune version: 1 name: "air-below" tempo: 72 speed: 6 channels: 8
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the long rank" patch: (drone-fm level: 0.3 index: 1.3 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.25 release: 1.2) volume: 34 gain: 0.75 send: 0.5)
    (instrument id: 2 name: "wind on its lip" patch: (pipe-breath level: 0.4 width: 0.05 octave: 0.9 tone: 0.05 swell: 0.5 swell-rate: 0.12 attack: 0.3 release: 1.5 seed: 23) volume: 24 gain: 1.1 send: 0.5)
    (instrument id: 3 name: "drop with soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.8 send: 0.3)
    (instrument id: 4 name: "the ranks" patch: (drone-fm level: 0.3 index: 1.4 index-wander: 0.2 index-rate: 0.1 mod: 1 breath-lo: 0.75 breath-rate: 0.25 attack: 1.4 release: 2.5 seed: 41) volume: 22 gain: 0.6 send: 0.5)
    (instrument id: 5 name: "pedal" patch: (drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 0.8 release: 2.5 seed: 11) volume: 28 gain: 0.6 send: 0.35)
    (instrument id: 6 name: "the octave rank" patch: (drone-fm level: 0.3 index: 0.4 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.3 release: 1.2) volume: 16 gain: 0.6 send: 0.6))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (4 "A-3" 4 18 "000") (5 "C-4" 4 18 "000") (6 "E-4" 4 18 "000") (7 "A-2" 5 28 "000"))
      (row 8 (2 "E-5" 2 26 "000"))
      (row 16 (4 "F-3" 4 18 "000") (5 "A-3" 4 18 "000") (6 "C-4" 4 18 "000") (7 "F-2" 5 28 "000"))
      (row 24 (2 "C-5" 2 26 "000"))
      (row 32 (4 "G-3" 4 18 "000") (5 "C-4" 4 18 "000") (6 "E-4" 4 18 "000") (7 "C-3" 5 28 "000"))
      (row 40 (2 "E-5" 2 26 "000") (3 "C-6" 3 20 "000"))
      (row 48 (2 "G-5" 2 26 "000") (4 "G-3" 4 18 "000") (5 "A#3" 4 18 "000") (6 "G-4" 4 18 "000") (7 "G-2" 5 28 "000"))
      (row 56 (2 "F-5" 2 26 "000")))
    (pattern id: 1 rows: 64
      (row 0 (1 "A-3" 1 30 "000") (4 "A-3" 4 18 "000") (5 "C-4" 4 18 "000") (6 "E-4" 4 18 "000") (7 "A-2" 5 28 "000") (8 "A-4" 6 13 "000"))
      (row 8 (1 "A-4" 1 30 "000") (2 "E-5" 2 26 "000") (8 "A-5" 6 13 "000"))
      (row 16 (4 "F-3" 4 18 "000") (5 "A-3" 4 18 "000") (6 "C-4" 4 18 "000") (7 "F-2" 5 28 "000"))
      (row 32 (1 "G-4" 1 30 "000") (2 "===" 0 0 "000") (4 "G-3" 4 18 "000") (5 "C-4" 4 18 "000") (6 "E-4" 4 18 "000") (7 "C-3" 5 28 "000") (8 "G-5" 6 13 "000"))
      (row 36 (3 "A-5" 3 20 "000"))
      (row 40 (1 "E-4" 1 30 "000") (8 "E-5" 6 13 "000"))
      (row 48 (4 "A-3" 4 18 "000") (5 "C-4" 4 18 "000") (6 "E-4" 4 18 "000") (7 "A-2" 5 28 "000"))
      (row 56 (1 "===" 0 0 "000") (8 "===" 0 0 "000")))
    (pattern id: 2 rows: 32
      (row 8 (4 "===" 0 0 "000") (5 "===" 0 0 "000") (6 "===" 0 0 "000") (7 "===" 0 0 "000")))
    (pattern id: 3 rows: 29))
  (order 0 1 2 3)
  (history ("claude" "2026-10-12" "Pipes SOUND (D53, the stone organ): wandering, pipes 0.6+. Air rising through the ranks: Am, F, C, Gm, Am, F, C, Am, a bar each; the wind on the lip draws a high line, E5 C5 E5 G5 F5 E5; the long rank makes the leap A3 to A4 once and holds it. Written by tools/pipes-compose.mjs; edit the score there.")))
