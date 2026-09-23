(tune version: 1 name: "wind-hollow" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.5 damp: 0.7 mix: 0.12)
  (instruments
    (instrument id: 1 name: "hollow wind" patch: (noise-bed color: pink level: 1.0 centre: 420 width: 1.2 wander: 0.25 rate: 0.05 gust: 0.3 gust-rate: 0.07 hp: 220 lp: 1600 attack: 3 release: 4 seed: 2) volume: 40 gain: 2 send: 0.2))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 40 "000")))
    (pattern id: 1 rows: 80
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: wind in a sheltered hollow")))
