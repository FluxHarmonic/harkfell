(tune version: 1 name: "pickup-h5" tempo: 120 speed: 4 channels: 6
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.32)
  (instruments
    (instrument id: 1 name: "H5 joins the carried series" patch: (drone-fm level: 0.32 index: 1.2 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.008 release: 2.4 cents: -13.686) volume: 44 gain: 1 send: 0.5)
    (instrument id: 2 name: "its 15th and 30th partials" patch: (drone-fm level: 0.32 index: 1.2 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.008 release: 2.4 cents: -11.731) volume: 34 gain: 1 send: 0.5)
    (instrument id: 3 name: "its 25th partial" patch: (drone-fm level: 0.32 index: 1.2 index-wander: 0 mod: 2 breath-lo: 1 attack: 0.008 release: 2.4 cents: -27.373) volume: 26 gain: 1 send: 0.5))
  (patterns
    (pattern id: 0 rows: 24
      (row 0 (1 "F#4" 1 44 "000"))
      (row 1 (1 "===" 0 0 "000"))
      (row 2 (2 "F#5" 1 38 "000"))
      (row 3 (2 "===" 0 0 "000"))
      (row 4 (3 "C#6" 2 34 "000"))
      (row 5 (3 "===" 0 0 "000"))
      (row 6 (4 "F#6" 1 30 "000"))
      (row 7 (4 "===" 0 0 "000"))
      (row 8 (5 "A#6" 3 26 "000"))
      (row 9 (5 "===" 0 0 "000"))
      (row 10 (6 "C#7" 2 22 "000"))
      (row 11 (6 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-11" "Cloudstair SOUND (Opus take): H5 taken: its own partials rising, 5 10 15 20 25 30 times D2 (F#4 F#5 C#6 F#6 A#6 C#7), the rule pickup-h2, -h3 and -h4 set. Each is a struck drone-fm voice with the partial's just tuning in cents (F# -13.686, C# -11.731, A# -27.373), so H5 enters at the pitch the carried drone then holds; motif's bell kind ignores cents:."))))
