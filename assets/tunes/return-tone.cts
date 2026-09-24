(tune version: 1 name: "return-tone" tempo: 120 speed: 3 channels: 1
  (bus reverb: zitarev size: 0.6 damp: 0.5 mix: 0.25)
  (instruments
    (instrument id: 1 name: "low tone" patch: (drone-fm level: 0.4 index: 2.5 index-wander: 0 breath-lo: 1 attack: 0.05 release: 0.8) volume: 40 send: 0.3))
  (patterns
    (pattern id: 0 rows: 8
      (row 0 (1 "D-3" 1 40 "000"))
      (row 6 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A2: the soft return's short low tone (section 3, Harm)")))
