(tune version: 1 name: "ice-creak" tempo: 120 speed: 3 channels: 2
  (bus reverb: zitarev size: 0.6 damp: 0.5 mix: 0.2)
  (instruments
    (instrument id: 1 name: "the ice groans under you" patch: (noise-bed color: white level: 1.0 track: 1 centre: 1 width: 0.18 wander: 0 trem: 0.9 trem-rate: 23 hp: 300 attack: 0.02 release: 0.08 seed: 217) volume: 44 gain: 2 send: 0.2)
    (instrument id: 2 name: "the ice sings" patch: (bell fm-index: 0.25 fm-mod: 1.0 attack: 0.01 decay: 0.3 sustain: 0.0 release: 0.1) volume: 20 gain: 0.6 send: 0.4))
  (patterns
    (pattern id: 0 rows: 8
      (row 0 (1 "C-5" 1 44 "208") (2 "E-6" 2 20 "230"))
      (row 1 (1 "..." 0 0 "200") (2 "..." 0 0 "200"))
      (row 2 (1 "..." 0 0 "200") (2 "..." 0 0 "200"))
      (row 3 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-28" "Glasswood SOUND: thin ice creaking under a body standing on it (a third and two thirds of the second before it gives): a narrow band of noise at C5 rattling at 23 Hz and sagging, with the faint falling whistle frozen lakes make when they flex.")))
