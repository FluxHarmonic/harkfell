(tune version: 1 name: "heart-call" tempo: 60 speed: 15 channels: 4
  (bus reverb: zitarev size: 0.85 damp: 0.5 mix: 0.3)
  (instruments
    (instrument id: 1 name: "H2" patch: (finding-tone level: 0.4 index: 1.1 pulse: 0.8 pulse-rate: 0.45 cutoff: 5000 attack: 1.5 release: 2 seed: 81) volume: 34 send: 0.4)
    (instrument id: 2 name: "H3" patch: (finding-tone cents: 1.955 level: 0.4 index: 1.1 pulse: 0.8 pulse-rate: 0.45 cutoff: 5000 attack: 1.5 release: 2 seed: 82) volume: 30 send: 0.4)
    (instrument id: 3 name: "H4" patch: (finding-tone level: 0.4 index: 1.1 pulse: 0.8 pulse-rate: 0.45 cutoff: 5000 attack: 1.5 release: 2 seed: 83) volume: 28 send: 0.4)
    (instrument id: 4 name: "H5" patch: (finding-tone cents: -13.686 level: 0.4 index: 1.1 pulse: 0.8 pulse-rate: 0.45 cutoff: 5000 attack: 1.5 release: 2 seed: 84) volume: 28 send: 0.4))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-3" 1 34 "000") (2 "A-3" 2 30 "000") (3 "D-4" 3 28 "000") (4 "F#4" 4 28 "000")))
    (pattern id: 1 rows: 32
      (row 31 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-10-12" "Underhum SOUND: the heart's call once all four are carried (D45, voiced as the bible asks): not the fundamental (a phone cannot play 73 Hz) but its four overtones, H2 H3 H4 H5, as finding tones pulsing together, all at one pulse rate from one start, so the ear hears the missing D under them.")))
