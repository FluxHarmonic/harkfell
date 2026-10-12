(tune version: 1 name: "drip-climb" tempo: 125 speed: 5 channels: 8
  (bus reverb: zitarev size: 0.85 damp: 0.4 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the 8th, D4" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6) volume: 20 gain: 1 send: 0.45)
    (instrument id: 2 name: "the 9th, E4" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6 cents: 3.91) volume: 22 gain: 1 send: 0.45)
    (instrument id: 3 name: "the 10th, F#4" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6 cents: -13.686) volume: 24 gain: 1 send: 0.45)
    (instrument id: 4 name: "the 11th, G#4 49 cents flat" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6 cents: -48.682) volume: 26 gain: 1 send: 0.45)
    (instrument id: 5 name: "the 12th, A4" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6 cents: 1.955) volume: 28 gain: 1 send: 0.45)
    (instrument id: 6 name: "the 13th, B-flat 41 cents sharp" patch: (drone-fm level: 0.3 index: 0.7 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.18 release: 1.6 cents: 40.528) volume: 30 gain: 1 send: 0.45)
    (instrument id: 7 name: "the 14th, H7: C5 31 cents flat" patch: (drone-fm level: 0.3 index: 0.9 index-wander: 0 mod: 1 breath-lo: 1 attack: 0.05 release: 2.2 cents: -31.174) volume: 34 gain: 1 send: 0.5)
    (instrument id: 8 name: "H7's octave, struck as it lands" patch: (drone-fm level: 0.3 index: 1.4 index-wander: 0 mod: 3.5 breath-lo: 1 attack: 0.004 release: 2.4 cents: -31.174) volume: 24 gain: 1 send: 0.55))
  (patterns
    (pattern id: 0 rows: 76
      (row 0 (1 "D-4" 1 20 "000"))
      (row 9 (2 "E-4" 2 22 "000"))
      (row 17 (3 "F#4" 3 24 "000"))
      (row 24 (4 "G#4" 4 26 "000"))
      (row 30 (5 "A-4" 5 28 "000"))
      (row 35 (6 "A#4" 6 30 "000"))
      (row 40 (7 "C-5" 7 34 "000") (8 "C-6" 8 24 "000"))
      (row 46 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (3 "===" 0 0 "000") (4 "===" 0 0 "000") (5 "===" 0 0 "000") (6 "===" 0 0 "000"))
      (row 52 (7 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Wrongwater SOUND: the Ice Well door's anticipation build (David's ruling 1). The harmonic series of D climbs out of the crack, partials 8 to 14 (D4 E4 F#4, the 11th, A4, the 13th, then H7), each note entering and holding, a little louder than the last, and closer together (rows 0 9 17 24 30 35 40 at 0.1 s a row), as the drop's rings come closer together. The director starts it at 1.0 s of stillness by the drip and keeps its read position on the door's own stillness clock, so it lands on H7 at the door's 5.0 s. Every note is a drone-fm voice with the partial's cents (motif's bell and flute kinds ignore cents:).")))
