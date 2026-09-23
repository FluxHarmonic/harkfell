(tune version: 1 name: "wind-fell" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.6 damp: 0.5 mix: 0.15)
  (instruments
    (instrument id: 1 name: "fell wind" patch: (noise-bed color: pink level: 1.0 centre: 700 width: 1.6 wander: 0.45 rate: 0.07 gust: 0.55 gust-rate: 0.11 hp: 250 lp: 5000 attack: 3 release: 4 seed: 1) volume: 48 gain: 2 send: 0.2))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 48 "000")))
    (pattern id: 1 rows: 80
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: wind on the open fell")))
