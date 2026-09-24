(tune version: 1 name: "ring-h2" tempo: 120 speed: 4 channels: 3
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.4)
  (instruments
    (instrument id: 1 name: "ring-stone, sounding" patch: (bell fm-index: 2.2 fm-mod: 1.41 attack: 0.25 decay: 4.5 sustain: 0.0 release: 2.0) volume: 50 gain: 0.6 send: 0.6)
    (instrument id: 2 name: "its partials" patch: (bell fm-index: 1.2 fm-mod: 3.0 attack: 0.6 decay: 3.5 sustain: 0.0 release: 1.5) volume: 34 gain: 0.6 send: 0.6))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-3" 1 50 "000"))
      (row 3 (2 "D-4" 2 34 "000"))
      (row 6 (3 "A-4" 2 26 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A3 cue: a ring-stone keyed to H2 rings in sympathy: D3 swelling, its octave and twelfth after")))
