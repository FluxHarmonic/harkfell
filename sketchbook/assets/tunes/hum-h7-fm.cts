(tune version: 1 name: "hum-h7-fm" tempo: 60 speed: 15 channels: 6
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.28)
  (instruments
    (instrument id: 1 name: "fundamental D2" patch: (drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-rate: 0.03 breath-lo: 0.35 attack: 6 release: 8 seed: 1) volume: 26 gain: 2 send: 0.4)
    (instrument id: 2 name: "H2 D3" patch: (drone-fm level: 0.12 index: 2.4 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 38 gain: 2 send: 0.35)
    (instrument id: 3 name: "H3 A3" patch: (drone-fm level: 0.15 index: 1.4 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 34 gain: 2 send: 0.35)
    (instrument id: 4 name: "H4 D4" patch: (drone-fm level: 0.3 index: 1.8 breath-rate: 0.0189 breath-lo: 0.15 seed: 4) volume: 30 gain: 2 send: 0.35)
    (instrument id: 5 name: "H5 F#4" patch: (drone-fm level: 0.35 index: 1.1 cents: -13.686 breath-rate: 0.027 breath-lo: 0.15 seed: 5) volume: 28 gain: 2 send: 0.35)
    (instrument id: 6 name: "H7 C5" patch: (drone-fm level: 0.35 index: 1.0 cents: -31.174 breath-rate: 0.0244 breath-lo: 0.3 seed: 7) volume: 28 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 144
      (row 0 (1 "D-2" 1 26 "000") (2 "D-3" 2 38 "000") (3 "A-3" 3 34 "000") (4 "D-4" 4 30 "000") (5 "F#4" 5 28 "000"))
      (row 48 (6 "C-5" 6 28 "000"))
      (row 128 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (3 "===" 0 0 "000") (4 "===" 0 0 "000") (5 "===" 0 0 "000") (6 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-23" "S0 sketch: the whole drone, then H7 at 30 s: the dominant seventh ending")))
