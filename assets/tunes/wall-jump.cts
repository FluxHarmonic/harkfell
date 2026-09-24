(tune version: 1 name: "wall-jump" tempo: 120 speed: 2 channels: 2
  (instruments
    (instrument id: 1 name: "a breath, kicked" patch: (noise-bed color: pink level: 1.0 centre: 1600 width: 1.3 wander: 0 hp: 400 attack: 0.015 release: 0.14 seed: 82) volume: 40 gain: 2 send: 0.15)
    (instrument id: 2 name: "claws on the wall" patch: (noise-bed color: white level: 0.7 centre: 2600 width: 1.0 wander: 0 attack: 0.002 release: 0.05 seed: 83) volume: 30 gain: 2 send: 0.1))
  (patterns
    (pattern id: 0 rows: 8
      (row 0 (1 "D-4" 1 40 "000") (2 "D-4" 2 30 "000"))
      (row 1 (2 "===" 0 0 "000"))
      (row 2 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-24" "A4: the creature's movement (David: \"something minimal but there\"), a cue that sits well under the world")))
