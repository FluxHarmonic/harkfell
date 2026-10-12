(tune version: 1 name: "heart-sink" tempo: 120 speed: 4 channels: 3
  (bus reverb: zitarev size: 0.85 damp: 0.65 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the heart sinking" patch: (noise-bed color: brown level: 0.8 centre: 360 width: 1.3 wander: 0.4 rate: 2.5 gust: 0.5 gust-rate: 5.0 excite: 0.3 excite-freq: 800 attack: 0.1 release: 0.6 seed: 63) volume: 60 gain: 4 send: 0.25)
    (instrument id: 2 name: "its note going down" patch: (drone-fm level: 1.0 index: 1.6 index-wander: 0 mod: 1.41 breath-lo: 1 attack: 0.05 release: 1.6) volume: 30 gain: 0.6 send: 0.5))
  (patterns
    (pattern id: 0 rows: 20
      (row 0 (1 "D-3" 1 60 "000") (2 "D-4" 2 30 "000"))
      (row 1 (2 "..." 0 0 "220"))
      (row 6 (2 "===" 0 0 "000"))
      (row 12 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-10-12" "Underhum SOUND: the heart sinks into the bowl's floor (48 ticks): the ring-stones' rumble, deeper and longer, with the heart's own D4 sliding down under it as the floor opens.")))
