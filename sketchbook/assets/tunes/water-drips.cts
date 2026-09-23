(tune version: 1 name: "water-drips" tempo: 60 speed: 15 channels: 2
  (bus reverb: zitarev size: 0.85 damp: 0.35 mix: 0.3)
  (instruments
    (instrument id: 1 name: "cave air" patch: (noise-bed color: brown level: 1.0 centre: 450 width: 1.0 wander: 0.15 rate: 0.03 gust: 0.2 gust-rate: 0.05 hp: 300 lp: 1100 attack: 3 release: 4 seed: 14) volume: 24 gain: 2 send: 0.3)
    (instrument id: 2 name: "drip" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.31 feedback: 0.55 echo-mix: 0.55 hp: 400 seed: 15) volume: 40 gain: 2 send: 0.45))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 24 "000"))
      (row 5 (2 "A-5" 2 40 "000")))
    (pattern id: 1 rows: 80
      (row 3 (2 "D-6" 0 34 "000"))
      (row 12 (2 "F-5" 0 44 "000"))
      (row 19 (2 "A-5" 0 30 "000"))
      (row 20 (2 "C-6" 0 20 "000"))
      (row 31 (2 "E-6" 0 38 "000"))
      (row 37 (2 "A-5" 0 40 "000"))
      (row 48 (2 "D-6" 0 28 "000"))
      (row 55 (2 "G-5" 0 44 "000"))
      (row 62 (2 "A-5" 0 36 "000"))
      (row 70 (2 "C-6" 0 32 "000"))
      (row 71 (2 "E-6" 0 18 "000"))
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: drips echoing in a cave through the delay")))
