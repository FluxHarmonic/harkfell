(tune version: 1 name: "finale-drone" tempo: 72 speed: 6 channels: 6
  (bus reverb: zitarev size: 0.9 damp: 0.5 mix: 0.26)
  (instruments
    (instrument id: 1 name: "the fundamental" patch: (drone-saw level: 0.3 fm-index: 6 fm-level: 0.12 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-lo: 1 attack: 1.2 release: 8 seed: 1) volume: 30 gain: 2 send: 0.4)
    (instrument id: 2 name: "H2 D3" patch: (drone-saw level: 0.3 fm-index: 2.4 fm-level: 0.1 bright: 14 excite: 0.5 excite-freq: 500 breath-lo: 1 attack: 2 release: 4 seed: 2) volume: 24 gain: 2 send: 0.35)
    (instrument id: 3 name: "H3 A3" patch: (drone-saw level: 0.12 fm-index: 1.4 fm-level: 0.12 bright: 12 excite: 0.4 excite-freq: 600 cents: 1.955 breath-lo: 1 attack: 2 release: 4 seed: 3) volume: 22 gain: 2 send: 0.35)
    (instrument id: 4 name: "H4 D4" patch: (drone-saw level: 0.3 fm-index: 1.8 fm-level: 0.45 bright: 8 excite: 0.3 excite-freq: 900 breath-lo: 1 attack: 2 release: 4 seed: 4) volume: 21 gain: 2 send: 0.35)
    (instrument id: 5 name: "H5 F#4" patch: (drone-saw level: 0.3 fm-index: 1.1 fm-level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 cents: -13.686 breath-lo: 1 attack: 2 release: 4 seed: 5) volume: 19 gain: 2 send: 0.35)
    (instrument id: 6 name: "H7 C5" patch: (drone-saw level: 0.3 fm-index: 1.0 fm-level: 0.2 bright: 4 cents: -31.174 breath-lo: 1 attack: 2 release: 4 seed: 7) volume: 15 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 64
      (row 0 (2 "D-3" 2 24 "000") (3 "A-3" 3 22 "000") (4 "D-4" 4 21 "000") (5 "F#4" 5 19 "000") (6 "C-5" 6 15 "000"))
      (row 48 (1 "D-2" 1 30 "000")))
    (pattern id: 1 rows: 128
      (row 127 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-10-12" "Underhum SOUND: the fused drone of the ending. The carried voices H2 to H5 and H7, as the beds' drone (breath-lo 1: the director draws one breath for all of them, (harkfell finale)), and the fundamental, D2 in the bowl's hum voice, entering at row 48 (10 s), the downbeat of the piece's fourth bar. It holds until the director lets the voices go in close.")))
