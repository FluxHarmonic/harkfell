(tune version: 1 name: "zz-pa-hook" tempo: 72 speed: 6 channels: 8
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "wind in a carved mouth, singing" patch: (pipe-breath level: 0.55 width: 0.04 octave: 0.3 tone: 0.15 swell: 0.4 swell-rate: 0.09 attack: 0.5 release: 1.8 seed: 21) volume: 34 gain: 0.583 send: 0.45)
    (instrument id: 2 name: "the pipe's own note" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.35 release: 1.4) volume: 26 gain: 0.318 send: 0.4)
    (instrument id: 3 name: "drop with two soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.424 send: 0.3))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (1 "E-5" 1 34 "000") (2 "E-5" 2 22 "000"))
      (row 8 (1 "C-5" 1 34 "000") (2 "C-5" 2 22 "000"))
      (row 10 (3 "C-6" 3 26 "000"))
      (row 16 (1 "A-4" 1 34 "000") (2 "A-4" 2 22 "000"))
      (row 32 (1 "G-4" 1 34 "000") (2 "G-4" 2 22 "000"))
      (row 36 (1 "A-4" 1 34 "000") (2 "A-4" 2 22 "000"))
      (row 40 (1 "C-5" 1 34 "000") (2 "C-5" 2 22 "000"))
      (row 44 (3 "A-5" 3 24 "000"))
      (row 48 (1 "A#4" 1 34 "000") (2 "A#4" 2 22 "000"))
      (row 56 (1 "A-4" 1 34 "000") (2 "A-4" 2 22 "000")))
    (pattern id: 1 rows: 16
      (row 0 (1 "===" 0 0 "000") (2 "===" 0 0 "000")))
    (pattern id: 2 rows: 29))
  (order 0 1 2)
  (history ("claude" "2026-10-12" "Pipes rethink sketch A: the hook alone.")))
