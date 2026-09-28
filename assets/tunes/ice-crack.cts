(tune version: 1 name: "ice-crack" tempo: 120 speed: 3 channels: 3
  (bus reverb: zitarev size: 0.8 damp: 0.4 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the crack" patch: (noise-bed color: white level: 1.0 centre: 3000 width: 1.8 wander: 0 hp: 700 attack: 0.001 release: 0.07 seed: 219) volume: 50 gain: 2 send: 0.3)
    (instrument id: 2 name: "the sheet gives" patch: (noise-bed color: brown level: 1.0 centre: 650 width: 1.4 wander: 0 hp: 320 attack: 0.002 release: 0.25 seed: 220) volume: 40 gain: 2 send: 0.3)
    (instrument id: 3 name: "the ice sings as it breaks" patch: (bell fm-index: 0.3 fm-mod: 1.0 attack: 0.004 decay: 0.7 sustain: 0.0 release: 0.2) volume: 30 gain: 0.6 send: 0.5))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 50 "000") (2 "D-4" 2 40 "000") (3 "C#7" 3 30 "240"))
      (row 1 (1 "===" 0 0 "000") (3 "..." 0 0 "200"))
      (row 2 (3 "..." 0 0 "200"))
      (row 3 (2 "===" 0 0 "000") (3 "..." 0 0 "200"))
      (row 4 (3 "..." 0 0 "200"))
      (row 5 (3 "..." 0 0 "200"))))
  (order 0)
  (history ("claude" "2026-09-28" "Glasswood SOUND: thin ice gives: a sharp crack, the sheet breaking under it, and the long falling 'pew' a frozen lake makes as a crack runs (a soft bell sliding from C#7 down four semitones a tick).")))
