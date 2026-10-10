(tune version: 1 name: "air-below" tempo: 60 speed: 15 channels: 2
  (bus reverb: zitarev size: 0.9 damp: 0.45 mix: 0.28)
  (instruments
    (instrument id: 1 name: "wind in a carved mouth" patch: (pipe-breath level: 0.5 width: 0.07 octave: 0.3 tone: 0.07 swell: 0.7 swell-rate: 0.09 attack: 1.5 release: 2.5 seed: 21) volume: 30 gain: 0.65 send: 0.4)
    (instrument id: 2 name: "drop with two soft returns" patch: (drip level: 0.6 rise: 0.9 sweep: 0.035 decay: 0.07 echo: 0.31 feedback: 0.55 echo-mix: 0.55 hp: 400 seed: 15) volume: 30 gain: 0.6 send: 0.25))
  (patterns
    (pattern id: 0 rows: 46
      (row 0 (1 "C-4" 1 26 "000"))
      (row 13 (1 "===" 0 0 "000"))
      (row 20 (1 "F-4" 1 22 "000"))
      (row 32 (1 "===" 0 0 "000"))
      (row 38 (2 "E-6" 2 20 "000"))))
  (order 0))
