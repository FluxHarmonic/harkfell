(tune version: 1 name: "splash" tempo: 120 speed: 2 channels: 2
  (instruments
    (instrument id: 1 name: "into water" patch: (noise-bed color: white level: 0.9 centre: 2600 width: 1.8 wander: 0 hp: 500 attack: 0.004 release: 0.3 seed: 95) volume: 42 gain: 2 send: 0.25)
    (instrument id: 2 name: "a drop" patch: (drip level: 0.5 rise: 0.7 sweep: 0.04 decay: 0.08 echo: 0.0 hp: 300) volume: 30 send: 0.25))
  (patterns
    (pattern id: 0 rows: 8
      (row 0 (1 "D-4" 1 42 "000"))
      (row 1 (2 "A-5" 2 30 "000"))
      (row 3 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A4: the creature's movement (David: \"something minimal but there\"), a cue that sits well under the world")))
