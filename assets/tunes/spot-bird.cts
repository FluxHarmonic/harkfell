(tune version: 1 name: "spot-bird" tempo: 120 speed: 2 channels: 1
  (bus reverb: zitarev size: 0.7 damp: 0.4 mix: 0.3)
  (instruments
    (instrument id: 1 name: "reed bird" patch: (flute-wind attack: 0.02 release: 0.12 noise-amp: 0.1) volume: 36 send: 0.4))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "E-6" 1 30 "000"))
      (row 2 (1 "===" 0 0 "000"))
      (row 3 (1 "A-6" 1 36 "000"))
      (row 5 (1 "===" 0 0 "000"))
      (row 7 (1 "E-6" 1 26 "000"))
      (row 8 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A2 spot sound: a reed bird's three-note call")))
