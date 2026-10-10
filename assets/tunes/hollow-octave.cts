(tune version: 1 name: "hollow-octave" tempo: 60 speed: 6 channels: 4
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.28)
  (instruments
    (instrument id: 1 name: "H4 comes home" patch: (bell fm-index: 1.2 fm-mod: 2.0 attack: 0.01 decay: 2.6 sustain: 0.0 release: 1.2) volume: 40 gain: 0.54 send: 0.45)
    (instrument id: 2 name: "wind in a carved mouth" patch: (pipe-breath level: 0.5 width: 0.07 octave: 0.3 tone: 0.07 swell: 0.7 swell-rate: 0.09 attack: 1.5 release: 2.5 seed: 21) volume: 30 gain: 0.65 send: 0.4)
    (instrument id: 3 name: "drop with two soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.31 feedback: 0.55 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.6 send: 0.25))
  (patterns
    (pattern id: 0 rows: 74
      (row 0 (1 "D-4" 1 40 "000"))
      (row 4 (2 "D-5" 1 34 "000"))
      (row 8 (3 "A-5" 1 28 "000"))
      (row 12 (4 "A-3" 2 22 "000"))
      (row 20 (1 "F-4" 2 24 "000"))
      (row 27 (2 "C-6" 3 22 "000"))
      (row 34 (1 "===" 0 0 "000"))
      (row 40 (4 "===" 0 0 "000"))
      (row 44 (1 "D-4" 1 36 "000"))
      (row 48 (2 "D-5" 1 30 "000"))))
  (order 0))
