(tune version: 1 name: "ring-heart" tempo: 120 speed: 4 channels: 7
  (bus reverb: zitarev size: 0.95 damp: 0.5 mix: 0.42)
  (instruments
    (instrument id: 1 name: "the heart, sounding" patch: (drone-fm level: 1.0 index: 2.0 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.2 release: 4.5) volume: 50 gain: 0.6 send: 0.6)
    (instrument id: 2 name: "H3" patch: (drone-fm cents: 1.955 level: 1.0 index: 1.4 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.25 release: 4) volume: 40 gain: 0.6 send: 0.6)
    (instrument id: 3 name: "H4" patch: (drone-fm level: 1.0 index: 1.3 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.25 release: 4) volume: 36 gain: 0.6 send: 0.6)
    (instrument id: 4 name: "H5" patch: (drone-fm cents: -13.686 level: 1.0 index: 1.2 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.25 release: 4) volume: 34 gain: 0.6 send: 0.6)
    (instrument id: 5 name: "the stones answer" patch: (fm4-bell index: 1.0 amp-decay: 3.5 amp-release: 1.5 vel-depth: 0.5) volume: 40 gain: 0.6 send: 0.5)
    (instrument id: 6 name: "the stones answer, H5" patch: (drone-fm cents: -13.686 level: 0.3 index: 1.4 index-wander: 0 mod: 3.5 breath-lo: 1 attack: 0.004 release: 2.6) volume: 34 gain: 0.6 send: 0.5))
  (patterns
    (pattern id: 0 rows: 24
      (row 0 (1 "D-3" 1 50 "000"))
      (row 1 (2 "A-3" 2 40 "000"))
      (row 2 (3 "D-4" 3 36 "000"))
      (row 3 (4 "F#4" 4 34 "000"))
      (row 4 (1 "===" 0 0 "000") (2 "===" 0 0 "000") (3 "===" 0 0 "000") (4 "===" 0 0 "000"))
      (row 8 (5 "D-5" 5 40 "000") (6 "F#5" 6 34 "000") (7 "A-4" 5 36 "000"))
      (row 9 (6 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Underhum SOUND: the heart stone rings (harkfell-underhum-bible: it rings, 40 ticks, and the bowl's standing stones answer with the full chord). The four harmonics bloom up from D3 a twelfth of a second apart, as the card's overtones did, all on drone-fm so H3's and H5's just tunings take; at 0.67 s the stones answer D5 F#5 A4. A ring-h5's stroke on every partial at once.")))
