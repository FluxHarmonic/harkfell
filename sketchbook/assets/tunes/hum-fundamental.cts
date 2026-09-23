(tune version: 1 name: "hum-fundamental" tempo: 60 speed: 15 channels: 1
  (bus reverb: zitarev size: 0.9 damp: 0.6 mix: 0.25)
  (instruments
    (instrument id: 1 name: "fundamental D2" patch: (drone-saw level: 0.3 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-rate: 0.03 breath-lo: 0.35 attack: 6 release: 8 seed: 1) volume: 30 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 80
      (row 0 (1 "D-2" 1 30 "000"))
      (row 64 (1 "===" 0 0 "000"))))
  (order 0)
  (history ("claude" "2026-09-23" "S0 sketch: the fundamental, faint, under the first room")))
