(tune version: 1 name: "tread-creak" tempo: 120 speed: 3 channels: 2
  (bus reverb: zitarev size: 0.75 damp: 0.6 mix: 0.25)
  (instruments
    (instrument id: 1 name: "stone grinding on stone" patch: (noise-bed color: brown level: 1.0 centre: 700 width: 0.6 wander: 0.5 rate: 9 gust: 0.6 gust-rate: 14 excite: 0.5 excite-freq: 1100 attack: 0.08 release: 0.25 seed: 94) volume: 50 gain: 3 send: 0.25)
    (instrument id: 2 name: "a grain of it" patch: (noise-bed color: white level: 0.8 centre: 1900 width: 1.0 wander: 0.6 rate: 20 gust: 0.7 gust-rate: 30 attack: 0.004 release: 0.06 seed: 95) volume: 30 gain: 2 send: 0.3))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-4" 1 50 "000"))
      (row 3 (2 "D-5" 2 30 "000"))
      (row 4 (2 "===" 0 0 "000"))
      (row 6 (2 "D-5" 2 24 "000"))
      (row 7 (2 "===" 0 0 "000"))
      (row 8 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Underhum SOUND: a worn tread's warning, a second before it cracks (as thin ice creaks): stone grinding against stone, with two grains of grit.")))
