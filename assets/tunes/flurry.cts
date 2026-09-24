(tune version: 1 name: "flurry" tempo: 120 speed: 2 channels: 2
  (bus reverb: zitarev size: 0.6 damp: 0.5 mix: 0.2)
  (instruments
    (instrument id: 1 name: "wings" patch: (noise-bed color: pink level: 0.7 centre: 2600 width: 1.6 wander: 0.2 rate: 2.0 trem: 0.9 trem-rate: 22.0 attack: 0.02 release: 0.25 seed: 11) volume: 34 send: 0.15)
    (instrument id: 2 name: "reedling" patch: (flute-wind attack: 0.008 decay: 0.05 sustain: 0.5 release: 0.05 noise-amp: 0.08) volume: 26 send: 0.3))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 34 "000") (2 "B-6" 2 26 "000"))
      (row 1 (2 "===" 0 0 "000"))
      (row 3 (2 "G-6" 2 24 "000"))
      (row 4 (2 "===" 0 0 "000"))
      (row 6 (1 "===" 0 0 "000") (2 "C-7" 2 20 "000"))
      (row 7 (2 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A3 call: a reedling flock lifts off: a burst of wings and alarm chirps")))
