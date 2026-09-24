(tune version: 1 name: "return-tone" tempo: 120 speed: 3 channels: 2
  (bus reverb: zitarev size: 0.5 damp: 0.5 mix: 0.2)
  (instruments
    (instrument id: 1 name: "soft bell" patch: (drone-fm level: 0.5 index: 1.6 index-wander: 0 breath-lo: 1 attack: 0.01 release: 0.6) volume: 44 send: 0.25)
    (instrument id: 2 name: "low under it" patch: (drone-fm level: 0.3 index: 2.2 index-wander: 0 breath-lo: 1 attack: 0.02 release: 0.8) volume: 24 send: 0.2))
  (patterns
    (pattern id: 0 rows: 12
      (row 0 (1 "A-4" 1 44 "000") (2 "D-4" 2 24 "000"))
      (row 3 (1 "===" 0 0 "000"))
      (row 4 (1 "F-4" 1 40 "000"))
      (row 8 (1 "===" 0 0 "000") (2 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A2: the soft return's short low tone (section 3, Harm)")
           ("claude" "2026-09-24" "A2, after David's first play (\"I didn't even realize it played\"): a clearer, still gentle two-note fall, A4 to F4 over a soft D4, in the band a phone speaker plays")))
