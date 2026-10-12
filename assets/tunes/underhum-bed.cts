(tune version: 1 name: "underhum-bed" tempo: 60 speed: 15 channels: 8
  (bus reverb: zitarev size: 0.95 damp: 0.55 mix: 0.3)
  (instruments
    (instrument id: 1 name: "the fundamental" patch: (drone-saw level: 0.3 fm-index: 6 fm-level: 0.12 bright: 14 detune: 3 excite: 0.5 excite-freq: 350 excite-drive: 4 breath-rate: 0.03 breath-lo: 0.35 attack: 6 release: 8 seed: 1) volume: 28 gain: 2 send: 0.4)
    (instrument id: 2 name: "the hollow's own ring" patch: (pipe-breath level: 0.5 width: 0.12 octave: 0.5 tone: 0.05 swell: 0.8 swell-rate: 0.035 attack: 4 release: 5 seed: 61) volume: 26 gain: 1.2 send: 0.55)
    (instrument id: 3 name: "one distant drip" patch: (drip level: 0.4 rise: 0.7 sweep: 0.04 decay: 0.08 echo: 0.43 feedback: 0.55 echo-mix: 0.55 hp: 500 seed: 62) volume: 16 gain: 1 send: 0.6)
    (instrument id: 4 name: "H2 D3" patch: (drone-saw level: 0.3 fm-index: 2.4 fm-level: 0.1 bright: 14 excite: 0.5 excite-freq: 500 breath-rate: 0.0213 breath-lo: 0.15 seed: 2) volume: 24 gain: 2 send: 0.35)
    (instrument id: 5 name: "H3 A3" patch: (drone-saw level: 0.12 fm-index: 1.4 fm-level: 0.12 bright: 12 excite: 0.4 excite-freq: 600 cents: 1.955 breath-rate: 0.0323 breath-lo: 0.15 seed: 3) volume: 22 gain: 2 send: 0.35)
    (instrument id: 6 name: "H4 D4" patch: (drone-saw level: 0.3 fm-index: 1.8 fm-level: 0.45 bright: 8 excite: 0.3 excite-freq: 900 breath-rate: 0.0189 breath-lo: 0.15 seed: 4) volume: 21 gain: 2 send: 0.35)
    (instrument id: 7 name: "H5 F#4" patch: (drone-saw level: 0.3 fm-index: 1.1 fm-level: 0.3 bright: 8 excite: 0.3 excite-freq: 900 cents: -13.686 breath-rate: 0.027 breath-lo: 0.15 seed: 5) volume: 19 gain: 2 send: 0.35)
    (instrument id: 8 name: "H7 C5" patch: (drone-saw level: 0.3 fm-index: 1.0 fm-level: 0.2 bright: 4 cents: -31.174 breath-rate: 0.0161 breath-lo: 0.12 seed: 7) volume: 15 gain: 2 send: 0.4))
  (patterns
    (pattern id: 0 rows: 16
      (row 0 (1 "D-2" 1 28 "000") (2 "D-4" 2 26 "000") (4 "D-3" 4 24 "000") (5 "A-3" 5 22 "000") (6 "D-4" 6 21 "000") (7 "F#4" 7 19 "000") (8 "C-5" 8 15 "000")))
    (pattern id: 1 rows: 128
      (row 9 (3 "A-5" 3 16 "000"))
      (row 30 (3 "E-6" 3 12 "000"))
      (row 41 (3 "A-5" 3 14 "000"))
      (row 67 (3 "D-6" 3 12 "000"))
      (row 83 (3 "A-5" 3 16 "000"))
      (row 101 (3 "E-6" 3 11 "000"))
      (row 127 (1 "..." 0 0 "B01"))))
  (order 0 1)
  (history ("claude" "2026-10-12" "Underhum SOUND: the region's bed (harkfell-underhum-bible, The sound). bed-channels (hum air water drone): 1 the fundamental, D2 in the bowl's own hum voice, strongest in the chamber; 2 no wind at all, the hollow's own slow ring, a breath resonating on D4 and D5; 3 one distant drip, heard where a room names water (E); 4 to 8 the drone H2 H3 H4 H5 H7 as every bed has it, channel 8 the shared H7 line. One loop is 80 s.")))
