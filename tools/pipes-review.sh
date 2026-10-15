#!/bin/sh
# Render the Pipes' Stage 2 listening page (D53, the stone organ):
#   tools/pipes-review.sh [OUT] [HARNESS]
# OUT defaults to build/pipes-listening-d53, HARNESS to build/audio-harness/bin/harkfell-test
#. The 0.3 tunes come from
# integration/cloudstair as zz-was-* copies in assets/tunes for the render and are removed
# again. Renders locally with tools/cloudstair-render.sgl; writes OUT/page/ (index.html and
# MP3s) with tools/pipes-review-page.mjs. Nothing is published.
set -eu
cd "$(dirname "$0")/.."
OUT=${1:-build/pipes-listening-d53}
H=${2:-build/audio-harness/bin/harkfell-test}
BASE=${PIPES_BASE:-integration/cloudstair}
JOBS=tools/pipes-review.jobs
[ -x "$H" ] || { echo "SETUP-FAILED: no harness at $H"; exit 2; }
mkdir -p "$OUT"
rm -f "${OUT:?}"/*.wav "${OUT:?}"/render.log
copied=""
cleanup() { for f in $copied; do rm -f "assets/tunes/$f"; done; }
trap cleanup EXIT
trap 'exit 130' INT TERM
for n in pipes-bed wind-in-stone three-echoes the-pipes-breathe air-below seep-song hollow-octave pickup-h4; do
  f="zz-was-$n.cts"
  [ -e "assets/tunes/$f" ] && { echo "SETUP-FAILED: assets/tunes/$f already exists"; exit 2; }
  copied="$copied $f"
  git show "$BASE:assets/tunes/$n.cts" | sed "s/name: \"$n\"/name: \"zz-was-$n\"/" > "assets/tunes/$f"
  grep -q "name: \"zz-was-$n\"" "assets/tunes/$f" || { echo "SETUP-FAILED: zz-was-$n not restored"; exit 2; }
done
JOBS="$JOBS" OUT="$OUT" PULSE_SINK=worker-null scripts/dev "$H" --no-strict tools/cloudstair-render.sgl > "$OUT/render.log" 2>&1 || true
grep -a -q 'RENDER-DONE' "$OUT/render.log" || { echo "render failed: see $OUT/render.log"; exit 1; }
bad=$(grep -a '^RENDERED ' "$OUT/render.log" | awk '$4 <= 0.00001 || $4 >= 1.0 {print $2, $4}')
[ -z "$bad" ] || { echo "bad peaks: $bad"; exit 1; }
for j in $(grep -o '^(job "[^"]*"' "$JOBS" | cut -d\" -f2); do [ -s "$OUT/$j.wav" ] || { echo "missing $j.wav"; exit 1; }; done
node tools/pipes-review-page.mjs "$OUT"
echo "REVIEW-DONE $OUT"
