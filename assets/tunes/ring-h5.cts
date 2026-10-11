(tune version: 1 name: "ring-h5" tempo: 120 speed: 4 channels: 3
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.4)
  (instruments
    (instrument id: 1 name: "ring-stone, sounding" patch: (drone-fm cents: -13.686 level: 1.0 index: 2.2 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.25 release: 4.5) volume: 56 gain: 0.6 send: 0.6)
    (instrument id: 2 name: "its partials" patch: (drone-fm cents: -13.686 level: 1.0 index: 1.2 index-wander: 0 mod: 3.0 breath-lo: 1 attack: 0.6 release: 3.5) volume: 34 gain: 0.6 send: 0.6)
    (instrument id: 3 name: "its partials, 15 times D2" patch: (drone-fm cents: -11.731 level: 1.0 index: 1.2 index-wander: 0 mod: 3.0 breath-lo: 1 attack: 0.6 release: 3.5) volume: 34 gain: 0.6 send: 0.6))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "F#4" 1 56 "000"))
      (row 3 (1 "===" 0 0 "000") (2 "F#5" 2 34 "000"))
      (row 6 (3 "C#6" 3 26 "000"))
      (row 10 (2 "===" 0 0 "000"))
      (row 13 (3 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-11" "Cloudstair SOUND (Opus take): the same ring, notes and FM ratios, voiced on drone-fm so its cents: takes effect. motif's bell kind ignores cents: (measured: a bell at F#4 with cents -13.686 sounds at 369.99 Hz, a drone-fm at 367.08), so the old ring sounded 13.7 cents sharp of H5's drone and finding tone. The stroke's decay is now the release after a note-off at the attack's peak; the C# partial (15 times D2) at -11.731.")))
