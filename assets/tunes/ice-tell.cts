(tune version: 1 name: "ice-tell" tempo: 120 speed: 3 channels: 3
  (bus reverb: zitarev size: 0.7 damp: 0.3 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the icicle rings, shivering" patch: (bell fm-index: 2.4 fm-mod: 3.5 attack: 0.004 decay: 1.1 sustain: 0.0 release: 0.4) volume: 50 gain: 0.6 send: 0.45)
    (instrument id: 2 name: "the ice rattling in its socket" patch: (noise-bed color: white level: 0.9 centre: 5200 width: 0.9 wander: 0 trem: 1.0 trem-rate: 34 hp: 2500 attack: 0.004 release: 0.12 seed: 211) volume: 34 gain: 2 send: 0.25)
    (instrument id: 3 name: "a glint an octave up" patch: (bell fm-index: 0.8 fm-mod: 2.0 attack: 0.004 decay: 0.5 sustain: 0.0 release: 0.3) volume: 22 gain: 0.6 send: 0.5))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D#7" 1 50 "4F4") (2 "D-4" 2 34 "000") (3 "D#8" 3 22 "000"))
      (row 1 (1 "..." 0 0 "400"))
      (row 2 (1 "..." 0 0 "400"))
      (row 3 (1 "..." 0 0 "400"))
      (row 4 (1 "..." 0 0 "400"))
      (row 5 (1 "..." 0 0 "400"))
      (row 6 (1 "..." 0 0 "400") (2 "===" 0 0 "000"))
      (row 7 (1 "..." 0 0 "400"))
      (row 8 (1 "..." 0 0 "400"))
      (row 9 (1 "..." 0 0 "400"))))
  (order 0)
  (history ("claude" "2026-09-27" "Glasswood ROOMS: PLACEHOLDER for SOUND, the icicle's tell (the bible: it shivers and rings one bright note, a sound the bed never makes). Added because the tell was silent and, in a moth-lit cave, the icicle unseen: David ran into one he never saw.") ("claude" "2026-09-28" "Glasswood SOUND: the real tell. One bright bell on D#7, the one pitch class D Lydian (the bed's chimes) never plays, shivering (vibrato, about 12 Hz, 1/2 semitone) while the ice rattles in its socket (white noise at 5 kHz, a 34 Hz tremolo) for 0.4 s; a faint D#8 glint over it. It lands before the fall (0.8 s after the tell), so the shiver is heard whole.")))
