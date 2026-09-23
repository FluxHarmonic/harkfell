(tune version: 1 name: "hum-build-fm" tempo: 60 speed: 15 channels: 4
  (bus reverb: zitarev size: 0.85 damp: 0.5 mix: 0.25)
  (instruments
    (instrument id: 1 name: "H2 D3" patch: (drone-fm level: 0.2 index: 1.6 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 40 gain: 2 send: 0.35)
    (instrument id: 2 name: "H3 A3" patch: (drone-fm level: 0.15 index: 1.4 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 36 gain: 2 send: 0.35)
    (instrument id: 3 name: "H4 D4" patch: (drone-fm level: 0.35 index: 1.2 breath-rate: 0.0189 breath-lo: 0.15 seed: 4) volume: 32 gain: 2 send: 0.35)
    (instrument id: 4 name: "H5 F#4" patch: (drone-fm level: 0.35 index: 1.1 cents: -13.686 breath-rate: 0.027 breath-lo: 0.15 seed: 5) volume: 30 gain: 2 send: 0.35))
  (patterns
    (pattern id: 0 rows: 192
      (row 0 (1 "D-3" 1 40 "000"))
      (row 32 (2 "A-3" 2 36 "000"))
      (row 64 (3 "D-4" 3 32 "000"))
      (row 96 (4 "F#4" 4 30 "000"))
      (row 176 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (3 "===" 0 0 "000") (4 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-23" "S0 sketch: the drone builds, H2 then H3 H4 H5 every 20 s, breathing")))
