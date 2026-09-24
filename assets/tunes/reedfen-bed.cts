(tune version: 1 name: "reedfen-bed" tempo: 60 speed: 15 channels: 8
  (bus reverb: zitarev size: 0.6 damp: 0.5 mix: 0.15)
  (instruments
    (instrument id: 1 name: "fell wind" patch: (noise-bed color: pink level: 1.0 centre: 700 width: 1.6 wander: 0.45 rate: 0.07 gust: 0.55 gust-rate: 0.11 hp: 250 lp: 5000 attack: 3 release: 4 seed: 1) volume: 40 gain: 2 send: 0.2)
    (instrument id: 2 name: "tarn" patch: (noise-bed color: brown level: 1.0 centre: 520 width: 1.3 wander: 0.2 rate: 0.05 gust: 0.6 gust-rate: 0.22 hp: 300 lp: 1500 attack: 3 release: 4 seed: 11) volume: 44 gain: 2 send: 0.15)
    (instrument id: 3 name: "reeds" patch: (noise-bed color: pink level: 1.0 centre: 3400 width: 0.8 wander: 0.25 rate: 0.12 gust: 0.6 gust-rate: 0.2 trem: 0.35 trem-rate: 7 hp: 1500 lp: 9000 attack: 3 release: 4 seed: 16) volume: 30 gain: 2 send: 0.15)
    (instrument id: 4 name: "H2 D3" patch: (drone-saw level: 0.3 fm-index: 2.4 fm-level: 0.1 bright: 14 excite: 0.5 excite-freq: 500 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 24 gain: 2 send: 0.35)
    (instrument id: 5 name: "H3 A3" patch: (drone-saw level: 0.12 fm-index: 1.4 fm-level: 0.12 bright: 12 excite: 0.4 excite-freq: 600 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 22 gain: 2 send: 0.35))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 40 "000") (2 "D-4" 2 44 "000") (3 "D-4" 3 30 "000") (4 "D-3" 4 24 "000") (5 "A-3" 5 22 "000")))
    (pattern id: 1 rows: 128
      (row 127 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-24" "A2: Reedfen's bed from S0's, with two drone channels, H2 (4) and H3 (5), each muted until carried")))
