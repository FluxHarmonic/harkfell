(tune version: 1 name: "zz-pb-hook" tempo: 72 speed: 6 channels: 8
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the long rank" patch: (drone-fm level: 0.3 index: 0.55 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.25 release: 1.2) volume: 34 gain: 0.75 send: 0.5)
    (instrument id: 2 name: "wind on its lip" patch: (pipe-breath level: 0.4 width: 0.05 octave: 0.5 tone: 0.05 swell: 0.5 swell-rate: 0.12 attack: 0.3 release: 1.5 seed: 23) volume: 24 gain: 1.1 send: 0.5)
    (instrument id: 3 name: "drop with two soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.8 send: 0.3)
    (instrument id: 6 name: "the octave rank" patch: (drone-fm level: 0.3 index: 0.4 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.3 release: 1.2) volume: 16 gain: 0.6 send: 0.6))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (1 "A-3" 1 34 "000") (2 "A-3" 2 22 "000") (8 "A-4" 6 14 "000"))
      (row 8 (1 "A-4" 1 34 "000") (2 "A-4" 2 22 "000") (8 "A-5" 6 14 "000"))
      (row 16 (1 "G-4" 1 34 "000") (2 "G-4" 2 22 "000") (8 "G-5" 6 14 "000"))
      (row 20 (1 "F-4" 1 34 "000") (2 "F-4" 2 22 "000") (8 "F-5" 6 14 "000"))
      (row 24 (1 "E-4" 1 34 "000") (2 "E-4" 2 22 "000") (8 "E-5" 6 14 "000"))
      (row 32 (1 "C-4" 1 34 "000") (2 "C-4" 2 22 "000") (8 "C-5" 6 14 "000"))
      (row 36 (3 "C-6" 3 24 "000"))
      (row 48 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (8 "===" 0 0 "000")))
    (pattern id: 1 rows: 29))
  (order 0 1)
  (history ("claude" "2026-10-12" "Pipes rethink sketch B: the hook alone.")))
