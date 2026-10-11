#!/bin/sh
# Render the Cloudstair sound review for David and write its page:
#   tools/cloudstair-review.sh [HARNESS]
# HARNESS is an audio-capable harkfell-test built at the task lock
# (default build/audio-harness/bin/harkfell-test; see
# folio procedures/harkfell-look-review-harness for pointing a copied one at
# this tree). Writes build/cloudstair-listening-opus/: mono 32 kHz WAVs, a
# manifest with each file's length, peak and loudness, and index.html.
# Nothing is published. The rose stone's ring and near miss from before this
# branch are restored under zz-* names from commit a783c64's parent for the
# comparison, and removed again.
set -eu
cd "$(dirname "$0")/.."
H=${1:-build/audio-harness/bin/harkfell-test}
OUT=build/cloudstair-listening-opus
[ -x "$H" ] || { echo "SETUP-FAILED: no harness at $H"; exit 2; }
mkdir -p "$OUT"
cleanup() { rm -f assets/tunes/zz-ring-h5-before.cts assets/tunes/zz-miss-h5-before.cts; }
trap cleanup EXIT
for n in ring-h5 miss-h5; do
  git show "a783c64^:assets/tunes/$n.cts" | sed "s/name: \"$n\"/name: \"zz-$n-before\"/" > "assets/tunes/zz-$n-before.cts"
  grep -q "zz-$n-before" "assets/tunes/zz-$n-before.cts" || { echo "SETUP-FAILED: zz-$n-before not restored"; exit 2; }
done
JOBS=tools/cloudstair-review.jobs OUT="$OUT" scripts/dev "$H" --no-strict tools/cloudstair-render.sgl > "$OUT/render.log" 2>&1
grep -a -q 'RENDER-DONE' "$OUT/render.log" || { echo "render failed: see $OUT/render.log"; exit 1; }
want=$(grep -c '^(job ' tools/cloudstair-review.jobs)
got=$(grep -a -c '^RENDERED ' "$OUT/render.log")
[ "$want" = "$got" ] || { echo "rendered $got of $want"; exit 1; }
node tools/cloudstair-review-page.mjs "$OUT"
