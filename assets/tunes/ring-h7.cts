(tune version: 1 name: "ring-h7" tempo: 120 speed: 4 channels: 3
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.4)
  (instruments
    (instrument id: 1 name: "the seventh, sounding" patch: (drone-fm cents: -31.174 level: 1.0 index: 2.2 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.25 release: 4.5) volume: 52 gain: 0.6 send: 0.6)
    (instrument id: 2 name: "its partials" patch: (drone-fm cents: -31.174 level: 1.0 index: 1.2 index-wander: 0 mod: 3.0 breath-lo: 1 attack: 0.6 release: 3.5) volume: 32 gain: 0.6 send: 0.6)
    (instrument id: 3 name: "its partials, 21 times D2" patch: (drone-fm cents: -29.217 level: 1.0 index: 1.2 index-wander: 0 mod: 3.0 breath-lo: 1 attack: 0.6 release: 3.5) volume: 24 gain: 0.6 send: 0.6))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "C-5" 1 52 "000"))
      (row 3 (1 "===" 0 0 "000") (2 "C-6" 2 32 "000"))
      (row 6 (3 "G-6" 3 24 "000"))
      (row 10 (2 "===" 0 0 "000"))
      (row 13 (3 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Underhum SOUND: H7's ring, for the Bearers' Rest's fifth bench (the bench handler plays ring-hN; Depths SYSTEMS' integration found none for H7). ring-h5's stroke and partials on H7's own series: C5 (7 times D2) and C6 (14) at -31.174 cents, G6 (21) at -29.217, all drone-fm so the cents take, a note-off at the attack's peak so the release is the decay.")))
