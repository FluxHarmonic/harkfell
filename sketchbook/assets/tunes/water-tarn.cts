(tune version: 1 name: "water-tarn" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.5 damp: 0.6 mix: 0.12)
  (instruments
    (instrument id: 1 name: "tarn" patch: (noise-bed color: brown level: 1.0 centre: 520 width: 1.3 wander: 0.2 rate: 0.05 gust: 0.6 gust-rate: 0.22 hp: 300 lp: 1500 attack: 3 release: 4 seed: 11) volume: 56 gain: 2 send: 0.15))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 56 "000")))
    (pattern id: 1 rows: 80
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: a still tarn")))
