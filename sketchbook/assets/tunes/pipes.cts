(tune version: 1 name: "pipes" tempo: 60 speed: 15 channels: 4
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.3)
  (instruments
    (instrument id: 1 name: "wind outside" patch: (noise-bed color: pink level: 1.0 centre: 380 width: 1.2 wander: 0.3 rate: 0.06 gust: 0.5 gust-rate: 0.1 hp: 200 lp: 900 attack: 3 release: 4 seed: 18) volume: 26 gain: 2 send: 0.2)
    (instrument id: 2 name: "pipe A" patch: (pipe-breath level: 0.6 width: 0.07 octave: 0.4 tone: 0.1 swell: 0.7 swell-rate: 0.09 attack: 3 release: 4 seed: 21) volume: 40 gain: 2 send: 0.45)
    (instrument id: 3 name: "pipe D" patch: (pipe-breath level: 0.6 width: 0.06 octave: 0.35 tone: 0.1 swell: 0.7 swell-rate: 0.07 attack: 4 release: 5 seed: 22) volume: 36 gain: 2 send: 0.45)
    (instrument id: 4 name: "pipe E" patch: (pipe-breath level: 0.6 width: 0.06 octave: 0.3 tone: 0.08 swell: 0.8 swell-rate: 0.11 attack: 4 release: 5 seed: 23) volume: 30 gain: 2 send: 0.5))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 26 "000") (2 "A-3" 2 40 "000"))
      (row 10 (3 "D-4" 3 36 "000")))
    (pattern id: 1 rows: 80
      (row 14 (4 "E-4" 4 30 "000"))
      (row 30 (3 "===" 0 0 "000"))
      (row 44 (4 "===" 0 0 "000"))
      (row 52 (3 "D-4" 3 36 "000"))
      (row 60 (4 "A-4" 4 24 "000"))
      (row 74 (4 "===" 0 0 "000"))
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: wind resonating in limestone pipes")))
