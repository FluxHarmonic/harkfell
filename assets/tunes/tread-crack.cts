(tune version: 1 name: "tread-crack" tempo: 120 speed: 2 channels: 3
  (bus reverb: zitarev size: 0.8 damp: 0.6 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the tread splitting" patch: (noise-bed color: white level: 1.0 centre: 1400 width: 1.6 wander: 0.6 rate: 30 gust: 0.7 gust-rate: 40 excite: 0.4 excite-freq: 2200 attack: 0.002 release: 0.12 seed: 91) volume: 60 gain: 2.5 send: 0.25)
    (instrument id: 2 name: "its weight giving" patch: (noise-bed color: brown level: 1.0 centre: 520 width: 1.2 wander: 0.4 rate: 6 gust: 0.5 gust-rate: 12 excite: 0.4 excite-freq: 900 attack: 0.005 release: 0.35 seed: 92) volume: 56 gain: 3 send: 0.3)
    (instrument id: 3 name: "grit falling" patch: (noise-bed color: pink level: 0.8 centre: 2600 width: 1.4 wander: 0.7 rate: 18 gust: 0.8 gust-rate: 25 attack: 0.02 release: 0.4 seed: 93) volume: 30 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 24
      (row 0 (1 "D-4" 1 60 "000") (2 "D-3" 2 56 "000"))
      (row 1 (1 "===" 0 0 "000"))
      (row 2 (1 "A-4" 1 44 "000"))
      (row 3 (1 "===" 0 0 "000") (3 "D-5" 3 30 "000"))
      (row 4 (2 "===" 0 0 "000"))
      (row 9 (3 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Underhum SOUND: a worn tread cracking (Revision 1's thin-ice treads in K and L; Underhum ROOMS asked for stone, not ice). A sharp split, a second smaller one, the weight giving under it, and grit falling.")))
