(tune version: 1 name: "pickup-h2" tempo: 120 speed: 4 channels: 6
  (bus reverb: zitarev size: 0.85 damp: 0.45 mix: 0.35)
  (instruments
    (instrument id: 1 name: "the harmonic joins you" patch: (bell fm-index: 1.2 fm-mod: 2.0 attack: 0.01 decay: 2.6 sustain: 0.0 release: 1.2) volume: 44 gain: 0.6 send: 0.5)
    (instrument id: 2 name: "the harmonic joins you, D4" patch: (bell fm-index: 1.2 fm-mod: 3.0 attack: 0.01 decay: 2.6 sustain: 0.0 release: 1.2) volume: 38 gain: 0.6 send: 0.5))
  (patterns
    (pattern id: 0 rows: 24
      (row 0 (1 "D-3" 1 44 "000"))
      (row 2 (2 "D-4" 2 38 "000"))
      (row 4 (3 "A-4" 1 34 "000"))
      (row 6 (4 "D-5" 1 30 "000"))
      (row 8 (5 "F#5" 1 26 "000"))
      (row 10 (6 "A-5" 1 22 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A3 cue: H2 taken; its own partials rise from D3 (2, 4, 6, 8, 10, 12 times the fundamental)")))
