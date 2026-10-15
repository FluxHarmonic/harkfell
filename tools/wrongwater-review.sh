#!/bin/sh
# Render the Wrongwater sound review for David and write its page:
#   tools/wrongwater-review.sh [HARNESS]
# HARNESS is an audio-capable harkfell-test built at the task lock
# (default build/audio-harness/bin/harkfell-test; see folio
# procedures/harkfell-look-review-harness for pointing a copied one at this
# tree). Writes build/wrongwater-listening/: mono 32 kHz WAVs, a manifest with
# each file's length, peak and loudness, and index.html. Nothing is published.
set -eu
cd "$(dirname "$0")/.."
H=${1:-build/audio-harness/bin/harkfell-test}
OUT=build/wrongwater-listening
[ -x "$H" ] || { echo "SETUP-FAILED: no harness at $H"; exit 2; }
mkdir -p "$OUT"
JOBS=tools/wrongwater-review.jobs OUT="$OUT" scripts/dev "$H" --no-strict tools/wrongwater-render.sgl > "$OUT/render.log" 2>&1
grep -a -q 'RENDER-DONE' "$OUT/render.log" || { echo "render failed: see $OUT/render.log"; exit 1; }
want=$(grep -c '^(job ' tools/wrongwater-review.jobs)
got=$(grep -a -c '^RENDERED ' "$OUT/render.log")
[ "$want" = "$got" ] || { echo "rendered $got of $want"; exit 1; }
node tools/wrongwater-review-page.mjs "$OUT"
