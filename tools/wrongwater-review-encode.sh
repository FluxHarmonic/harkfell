#!/bin/sh
# On a runner, after tools/wrongwater-render.sgl: measure the WAVs and write
# the page (tools/wrongwater-review-page.mjs, which reads them), encode each
# to Ogg Opus for the page, keep SHA256SUMS of the WAVs, then delete the WAVs,
# so the fetch is a few MB (a phone hotspot) and the renders stay verifiable.
#   tools/wrongwater-review-encode.sh DIR
# ffmpeg comes from guix (the runner image has none); node is on the PATH.
set -eu
D=$1
n=$(ls "$D"/*.wav | wc -l)
[ "$n" -gt 0 ] || { echo "SETUP-FAILED: no WAVs in $D"; exit 2; }
guix shell ffmpeg -- sh -c '
  set -eu
  D=$1
  AUDIO_EXT=ogg node tools/wrongwater-review-page.mjs "$D"
  (cd "$D" && sha256sum *.wav > SHA256SUMS)
  for w in "$D"/*.wav; do
    ffmpeg -hide_banner -loglevel error -y -i "$w" -c:a libopus -b:a 64k "${w%.wav}.ogg"
  done
' sh "$D"
ogg=$(ls "$D"/*.ogg | wc -l)
[ "$ogg" = "$n" ] || { echo "encoded $ogg of $n"; exit 1; }
rm -f "$D"/*.wav
echo "ENCODED $ogg recordings, $(du -sh "$D" | cut -f1)"
