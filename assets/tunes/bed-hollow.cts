(tune version: 1 name: "bed-hollow" tempo: 60 speed: 15 channels: 8
  (bus reverb: zitarev size: 0.85 damp: 0.5 mix: 0.22)
  (instruments
    (instrument id: 1 name: "wind in the ring" patch: (noise-bed color: pink level: 1.0 centre: 520 width: 1.3 wander: 0.35 rate: 0.05 gust: 0.4 gust-rate: 0.08 hp: 240 lp: 2600 excite: 0.15 excite-freq: 1800 attack: 3 release: 4 seed: 41) volume: 36 gain: 2 send: 0.2)
    (instrument id: 2 name: "far water" patch: (noise-bed color: brown level: 1.0 centre: 600 width: 1.2 wander: 0.2 rate: 0.04 gust: 0.5 gust-rate: 0.15 hp: 300 lp: 1400 attack: 3 release: 4 seed: 42) volume: 18 gain: 2 send: 0.2)
    (instrument id: 3 name: "the fundamental" patch: (drone-saw level: 0.3 fm-index: 6 fm-level: 0.12 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-rate: 0.03 breath-lo: 0.35 attack: 6 release: 8 seed: 1) volume: 26 gain: 2 send: 0.4)
    (instrument id: 4 name: "H2 D3" patch: (drone-saw level: 0.3 fm-index: 2.4 fm-level: 0.1 bright: 14 excite: 0.5 excite-freq: 500 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 30 gain: 2 send: 0.35)
    (instrument id: 5 name: "H3 A3" patch: (drone-saw level: 0.12 fm-index: 1.4 fm-level: 0.12 bright: 12 excite: 0.4 excite-freq: 600 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 28 gain: 2 send: 0.35)
    (instrument id: 6 name: "H4 D4" patch: (drone-saw level: 0.3 fm-index: 1.8 fm-level: 0.45 bright: 8 excite: 0.3 excite-freq: 900 breath-rate: 0.0189 breath-lo: 0.15 seed: 4) volume: 26 gain: 2 send: 0.35)
    (instrument id: 7 name: "H5 F#4" patch: (drone-saw level: 0.3 fm-index: 1.1 fm-level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 cents: -13.686 breath-rate: 0.027 breath-lo: 0.15 seed: 5) volume: 24 gain: 2 send: 0.35)
    (instrument id: 8 name: "H7 C5" patch: (drone-saw level: 0.3 fm-index: 1.0 fm-level: 0.2 bright: 8 excite: 0.3 excite-freq: 900 cents: -31.174 breath-rate: 0.0244 breath-lo: 0.3 seed: 7) volume: 22 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 36 "000") (2 "D-4" 2 18 "000") (3 "D-2" 3 26 "000") (4 "D-3" 4 30 "000") (5 "A-3" 5 28 "000") (6 "D-4" 6 26 "000") (7 "F#4" 7 24 "000") (8 "C-5" 8 22 "000")))
    (pattern id: 1 rows: 128
      (row 127 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-09-23" "S0 region bed: the Hollow")))
