(tune version: 1 name: "wind-cliff" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.7 damp: 0.4 mix: 0.18)
  (instruments
    (instrument id: 1 name: "cliff wind" patch: (noise-bed color: pink level: 1.0 centre: 1100 width: 1.5 wander: 0.6 rate: 0.18 gust: 0.8 gust-rate: 0.3 hp: 300 lp: 7000 excite: 0.2 excite-freq: 2500 attack: 2 release: 4 seed: 3) volume: 52 gain: 2 send: 0.25))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 52 "000")))
    (pattern id: 1 rows: 80
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: wind gusting on a cliff")))
