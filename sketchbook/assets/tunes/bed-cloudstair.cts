(tune version: 1 name: "bed-cloudstair" tempo: 60 speed: 15 channels: 8
  (bus reverb: zitarev size: 0.7 damp: 0.4 mix: 0.2)
  (instruments
    (instrument id: 1 name: "cliff wind" patch: (noise-bed color: pink level: 1.0 centre: 1100 width: 1.5 wander: 0.6 rate: 0.18 gust: 0.8 gust-rate: 0.3 hp: 300 lp: 7000 excite: 0.2 excite-freq: 2500 attack: 2 release: 4 seed: 3) volume: 44 gain: 2 send: 0.25)
    (instrument id: 2 name: "far falls" patch: (noise-bed color: pink level: 1.0 centre: 1500 width: 1.4 wander: 0.15 rate: 0.3 gust: 0.3 gust-rate: 0.5 hp: 500 lp: 4000 attack: 3 release: 4 seed: 51) volume: 12 gain: 2 send: 0.3)
    (instrument id: 3 name: "air in the rock" patch: (noise-bed color: pink level: 1.0 centre: 2600 width: 0.25 wander: 0.4 rate: 0.05 gust: 0.7 gust-rate: 0.07 excite: 0.4 excite-freq: 2000 attack: 4 release: 5 seed: 52) volume: 22 gain: 2 send: 0.35)
    (instrument id: 4 name: "H2 D3" patch: (drone-saw level: 0.3 bright: 14 excite: 0.5 excite-freq: 500 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 24 gain: 2 send: 0.35)
    (instrument id: 5 name: "H3 A3" patch: (drone-saw level: 0.12 bright: 12 excite: 0.4 excite-freq: 600 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 22 gain: 2 send: 0.35)
    (instrument id: 6 name: "H4 D4" patch: (drone-saw level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 breath-rate: 0.0189 breath-lo: 0.15 seed: 4) volume: 20 gain: 2 send: 0.35)
    (instrument id: 7 name: "H5 F#4" patch: (drone-saw level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 cents: -13.686 breath-rate: 0.027 breath-lo: 0.15 seed: 5) volume: 18 gain: 2 send: 0.35)
    (instrument id: 8 name: "H7 C5" patch: (drone-saw level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 cents: -31.174 breath-rate: 0.0244 breath-lo: 0.3 seed: 7) volume: 16 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 44 "000") (2 "D-4" 2 12 "000") (3 "D-4" 3 22 "000") (4 "D-3" 4 24 "000") (5 "A-3" 5 22 "000") (6 "D-4" 6 20 "000") (7 "F#4" 7 18 "000") (8 "C-5" 8 16 "000")))
    (pattern id: 1 rows: 128
      (row 127 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 region bed: Cloudstair")))
