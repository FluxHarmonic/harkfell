(tune version: 1 name: "zz-pc-hook" tempo: 72 speed: 6 channels: 8
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "pan pipe, near" patch: (fm4-pipe index: 1.2 attack-index: 3.0 drive: 0.2 vib-depth: 0.003 vib-delay: 0.3) volume: 34 gain: 0.308 send: 0.35)
    (instrument id: 2 name: "pan pipe, the first return" patch: (fm4-pipe index: 1.2 attack-index: 3.0 drive: 0.2 vib-depth: 0.003 vib-delay: 0.3) volume: 24 gain: 0.308 send: 0.6)
    (instrument id: 3 name: "pan pipe, the second return" patch: (fm4-pipe index: 1.2 attack-index: 3.0 drive: 0.2 vib-depth: 0.003 vib-delay: 0.3) volume: 17 gain: 0.308 send: 0.8)
    (instrument id: 4 name: "drop with two soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.4167 feedback: 0.5 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.448 send: 0.3))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (1 "A-4" 1 34 "000") (4 "A-5" 4 22 "000"))
      (row 4 (1 "C-5" 1 34 "000"))
      (row 8 (1 "E-5" 1 34 "000"))
      (row 16 (1 "D-5" 1 34 "000") (2 "A-4" 2 24 "000"))
      (row 20 (2 "C-5" 2 24 "000"))
      (row 22 (1 "C-5" 1 34 "000"))
      (row 24 (1 "A-4" 1 34 "000") (2 "E-5" 2 24 "000"))
      (row 26 (4 "E-6" 4 18 "000"))
      (row 32 (1 "===" 0 0 "000") (2 "D-5" 2 24 "000") (3 "A-4" 3 17 "000"))
      (row 36 (3 "C-5" 3 17 "000"))
      (row 38 (2 "C-5" 2 24 "000"))
      (row 40 (2 "A-4" 2 24 "000") (3 "E-5" 3 17 "000"))
      (row 48 (2 "===" 0 0 "000") (3 "D-5" 3 17 "000") (4 "C-6" 4 18 "000"))
      (row 54 (3 "C-5" 3 17 "000"))
      (row 56 (3 "A-4" 3 17 "000")))
    (pattern id: 1 rows: 16
      (row 0 (3 "===" 0 0 "000")))
    (pattern id: 2 rows: 29))
  (order 0 1 2)
  (history ("claude" "2026-10-12" "Pipes rethink sketch C: the hook alone, with its two returns.")))
