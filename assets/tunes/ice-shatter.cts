(tune version: 1 name: "ice-shatter" tempo: 120 speed: 2 channels: 5
  (bus reverb: zitarev size: 0.75 damp: 0.3 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the ice breaks" patch: (noise-bed color: white level: 1.0 centre: 4200 width: 1.6 wander: 0 hp: 900 attack: 0.001 release: 0.16 seed: 215) volume: 46 gain: 2 send: 0.25)
    (instrument id: 2 name: "the body of the break" patch: (noise-bed color: pink level: 1.0 centre: 900 width: 1.2 wander: 0 hp: 350 attack: 0.001 release: 0.09 seed: 216) volume: 34 gain: 2 send: 0.2)
    (instrument id: 3 name: "shards" patch: (bell fm-index: 3.2 fm-mod: 4.13 attack: 0.001 decay: 0.22 sustain: 0.0 release: 0.12) volume: 30 gain: 0.6 send: 0.45))
  (patterns
    (pattern id: 0 rows: 24
      (row 0 (1 "D-4" 1 46 "000") (2 "D-4" 2 34 "000") (3 "A#7" 3 34 "000"))
      (row 1 (4 "F-8" 3 26 "000") (1 "===" 0 0 "000"))
      (row 2 (5 "C#8" 3 30 "000") (2 "===" 0 0 "000"))
      (row 3 (3 "G-7" 3 26 "000"))
      (row 4 (4 "D#8" 3 22 "000"))
      (row 6 (5 "B-7" 3 24 "000"))
      (row 7 (3 "E-8" 3 16 "000"))
      (row 9 (4 "G#7" 3 18 "000"))
      (row 12 (5 "C-8" 3 14 "000"))
      (row 15 (3 "F#7" 3 10 "000"))))
  (order 0)
  (history ("claude" "2026-09-28" "Glasswood SOUND: the icicle shatters on the floor: a bright crack of noise with a body under it, then shards (short inharmonic bells, out of any mode) skittering away over 0.6 s, each quieter.")))
