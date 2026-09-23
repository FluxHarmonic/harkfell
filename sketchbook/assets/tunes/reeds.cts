(tune version: 1 name: "reeds" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.5 damp: 0.5 mix: 0.12)
  (instruments
    (instrument id: 1 name: "reeds" patch: (noise-bed color: pink level: 1.0 centre: 3400 width: 0.8 wander: 0.25 rate: 0.12 gust: 0.6 gust-rate: 0.2 trem: 0.35 trem-rate: 7 hp: 1500 lp: 9000 attack: 3 release: 4 seed: 16) volume: 40 gain: 2 send: 0.15))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 40 "000")))
    (pattern id: 1 rows: 80
      (row 79 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 sketch: reeds")))
