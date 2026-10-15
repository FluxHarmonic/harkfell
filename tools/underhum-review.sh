#!/bin/sh
# Render the Underhum sound review for David and write its page:
#   tools/underhum-review.sh [HARNESS]
# HARNESS is an audio-capable harkfell-test that loads this tree (default
# build/audio-harness/bin/harkfell-test; folio
# procedures/harkfell-look-review-harness, "For sound"). Writes
# build/underhum-listening/: the endings through the director
# (tools/underhum-render.sgl, stereo), the beds and cues
# (tools/cloudstair-render.sgl with tools/underhum-review.jobs, mono), a
# manifest with each file's length, peak and loudness, and index.html.
# Nothing is published.
set -eu
cd "$(dirname "$0")/.."
H=${1:-build/audio-harness/bin/harkfell-test}
OUT=build/underhum-listening
[ -x "$H" ] || { echo "SETUP-FAILED: no harness at $H"; exit 2; }
[ "$(readlink -f "$(dirname "$(dirname "$H")")/lib/harkfell")" = "$(pwd)/src/harkfell" ] || { echo "SETUP-FAILED: $H does not load this tree"; exit 2; }
mkdir -p "$OUT"
JOBS=tools/underhum-review.jobs OUT="$OUT" scripts/dev "$H" --no-strict tools/cloudstair-render.sgl > "$OUT/render-static.log" 2>&1
grep -a -q 'RENDER-DONE' "$OUT/render-static.log" || { echo "static render failed: see $OUT/render-static.log"; exit 1; }
want=$(grep -c '^(job ' tools/underhum-review.jobs)
got=$(grep -a -c '^RENDERED ' "$OUT/render-static.log")
[ "$want" = "$got" ] || { echo "static: rendered $got of $want"; exit 1; }
OUT="$OUT" scripts/dev "$H" --no-strict tools/underhum-render.sgl > "$OUT/render-ending.log" 2>&1
got=$(grep -a -c '^RENDERED ending' "$OUT/render-ending.log")
[ "$got" = 4 ] || { echo "endings: rendered $got of 4: see $OUT/render-ending.log"; exit 1; }
node tools/underhum-review-page.mjs "$OUT"
