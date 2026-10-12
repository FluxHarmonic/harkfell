#!/bin/sh
# Render the Pipes sound rethink's listening sketches (Stage 1):
#   tools/pipes-rethink/review.sh [JOBS] [OUT] [HARNESS]
# JOBS defaults to tools/pipes-rethink/review.jobs, OUT to build/pipes-rethink/review,
# HARNESS to build/audio-harness/bin/harkfell-test (an audio-capable harness at the
# task lock: folio procedures/harkfell-look-review-harness, "For sound").
# The sketches (tools/pipes-rethink/sketches/zz-*.cts, written by compose.mjs) are
# copied into assets/tunes for the render and removed again on exit. Renders locally
# with tools/cloudstair-render.sgl; nothing is published.
set -eu
cd "$(dirname "$0")/../.."
JOBS=${1:-tools/pipes-rethink/review.jobs}
OUT=${2:-build/pipes-rethink/review}
H=${3:-build/audio-harness/bin/harkfell-test}
[ -x "$H" ] || { echo "SETUP-FAILED: no harness at $H"; exit 2; }
mkdir -p "$OUT"
node tools/pipes-rethink/compose.mjs > /dev/null
copied=""
cleanup() { for f in $copied; do rm -f "assets/tunes/$f"; done; }
trap cleanup EXIT
for f in tools/pipes-rethink/sketches/zz-*.cts; do
  b=$(basename "$f")
  [ -e "assets/tunes/$b" ] && { echo "SETUP-FAILED: assets/tunes/$b already exists"; exit 2; }
  cp "$f" "assets/tunes/$b"; copied="$copied $b"
  cmp -s "$f" "assets/tunes/$b" || { echo "SETUP-FAILED: $b not copied"; exit 2; }
done
JOBS="$JOBS" OUT="$OUT" PULSE_SINK=worker-null scripts/dev "$H" --no-strict tools/cloudstair-render.sgl > "$OUT/render.log" 2>&1 || true
grep -a -q 'RENDER-DONE' "$OUT/render.log" || { echo "render failed: see $OUT/render.log"; exit 1; }
want=$(grep -c '^(job ' "$JOBS")
got=$(grep -a -c '^RENDERED ' "$OUT/render.log")
[ "$want" = "$got" ] || { echo "rendered $got of $want"; exit 1; }
for w in "$OUT"/*.wav; do
  printf '%s %s\n' "$(basename "$w" .wav)" "$(ffmpeg -hide_banner -nostats -i "$w" -af ebur128 -f null - 2>&1 | awk '/^ +I:/ {v=$2} END {print v}')"
done > "$OUT/loudness.txt"
node tools/pipes-rethink/page.mjs "$OUT"
echo "REVIEW-DONE $OUT"
