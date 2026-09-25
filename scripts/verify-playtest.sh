#!/bin/sh
# scripts/verify-playtest.sh [BINARY] - drive Harkfell headless with
# --playtest and check Substratic's reports end to end on the desktop:
#
#   open     the window opens at x2 of the 400x176 view (800x352)
#   report   F2, a typed note, Enter: report.json and screenshot.png land under
#            $XDG_DATA_HOME/harkfell/reports/; the note, the room (region:x,y),
#            the cell and the position are in the JSON, and the state is the
#            save datum; the PNG is 800x352, valid (ImageMagick checks its
#            CRCs) and not blank
#   input    the report's input log starts at the room's entry
#   discard  F2 then Escape writes nothing, closes the note (the game says so)
#            and does not quit the game
#
# Its own Xvfb, its own XDG_DATA_HOME, the sound to a null sink; never the
# real display. One PASS/FAIL per check, then GREEN or RED (exit 1), or
# SETUP-FAILED (exit 2). Run from the repository root after
# `scripts/dev sigil build` (or --config release, passing its binary).
set -u
BIN="${1:-build/dev/bin/harkfell}"
DISP="${DISP:-:89}"
WORK="$(mktemp -d /tmp/harkfell-verify-playtest.XXXXXX)"
export XDG_DATA_HOME="$WORK/data"
export PULSE_SINK=worker-null PIPEWIRE_NODE=worker-null
REPORTS="$XDG_DATA_HOME/harkfell/reports"
FAILS=0
say() { echo "verify-playtest: $*"; }
pass() { say "PASS $1"; }
fail() { say "FAIL $1 ($2)"; FAILS=$((FAILS + 1)); }
setup_failed() { say "SETUP-FAILED $*"; cleanup; exit 2; }

XVFB_PID=""; GAME_PID=""
# The PID whose exe ends in $1, whose cmdline carries $2 and whose cwd is $3
# (any, when empty). guix shell execs through wrappers, so $! is not it.
real_pid() {
  for d in /proc/[0-9]*; do
    p="${d#/proc/}"
    [ "$p" = "$$" ] && continue
    exe="$(readlink "$d/exe" 2>/dev/null || true)"
    case "$exe" in *"$1") ;; *) continue ;; esac
    tr '\0' ' ' < "$d/cmdline" 2>/dev/null | grep -q -- "$2" || continue
    [ -z "$3" ] || [ "$(readlink "$d/cwd" 2>/dev/null)" = "$3" ] || continue
    echo "$p"; return
  done
}
cleanup() {
  for p in $GAME_PID $XVFB_PID; do [ -n "$p" ] && kill "$p" 2>/dev/null; done
}
trap cleanup EXIT

[ -x "$BIN" ] || setup_failed "no binary $BIN"
[ -S "/tmp/.X11-unix/X${DISP#:}" ] && setup_failed "display $DISP is taken"
# the tools, realised once before any is used (a first guix shell prints its
# download progress, which must not land in a measurement)
for pkg in xorg-server xdotool imagemagick jq; do
  guix shell "$pkg" -- true >> "$WORK/guix-tools.log" 2>&1 || setup_failed "guix could not provide $pkg"
done

guix shell xorg-server -- Xvfb "$DISP" -screen 0 1400x900x24 +extension GLX -nolisten tcp > "$WORK/xvfb.log" 2>&1 &
i=0; until [ -S "/tmp/.X11-unix/X${DISP#:}" ]; do i=$((i + 1)); [ $i -gt 60 ] && setup_failed "Xvfb did not start"; sleep 1; done
XVFB_PID="$(real_pid /bin/Xvfb "Xvfb $DISP" "")"
[ -n "$XVFB_PID" ] || setup_failed "cannot attribute the Xvfb pid"

export DISPLAY="$DISP"
unset WAYLAND_DISPLAY
scripts/dev sh -c "exec $BIN --playtest --no-frame --build verify" > "$WORK/game.log" 2>&1 &
X="guix shell xdotool -- xdotool"
IM="guix shell imagemagick --"
JQ="guix shell jq -- jq"
i=0; XID=""
until [ -n "$XID" ]; do
  XID="$($X search --name "^Harkfell$" 2>/dev/null | head -1)"
  i=$((i + 1)); [ $i -gt 120 ] && { tail -20 "$WORK/game.log"; setup_failed "no window"; }
  sleep 1
done
GAME_PID="$(real_pid /harkfell "--build verify" "$(pwd)")"
sleep 4

geo="$($X getwindowgeometry "$XID" | awk '/Geometry/ {print $2}')"
[ "$geo" = "800x352" ] && pass "open 800x352" || fail open "geometry $geo"

$X windowfocus --sync "$XID" key F1
sleep 1
$X windowfocus --sync "$XID" key F2
sleep 1
# typed slowly: the window polls keys once a frame and a dev build under
# Xvfb's software GL can take over 250 ms a frame; two keys in one frame
# arrive in keycode order (the note "reeds" came out "erdes" at 250 ms)
$X windowfocus --sync "$XID" type --delay "${TYPE_DELAY:-700}" "reeds too thick"
$X windowfocus --sync "$XID" key Return
i=0; until ls "$REPORTS"/*/report.json >/dev/null 2>&1; do i=$((i + 1)); [ $i -gt 30 ] && break; sleep 1; done
R="$(ls -d "$REPORTS"/*/ 2>/dev/null | head -1)"
if [ -n "$R" ] && [ -f "$R/report.json" ]; then
  J="$R/report.json"
  [ "$($JQ -r .note "$J")" = "reeds too thick" ] && pass "report note" || fail "report note" "$($JQ -r .note "$J")"
  room="$($JQ -r .location.room "$J")"
  case "$room" in *:*,*) pass "report room ($room)" ;; *) fail "report room" "'$room'" ;; esac
  [ "$($JQ -r '.location.cell | length' "$J")" = "2" ] && [ "$($JQ -r '.location.position | length' "$J")" = "2" ] \
    && pass "report cell $($JQ -c .location.cell "$J") and position" || fail "report cell/position" "$($JQ -c .location "$J")"
  $JQ -e '.["state-sexp"] | startswith("(")' "$J" > /dev/null && pass "report state (the save datum)" || fail "report state" "no state-sexp"
  [ "$($JQ -r '.input["room-entered-tick"] | type' "$J")" = "number" ] && pass "input log from the room's entry" || fail input "$($JQ -c .input "$J")"
  idn="$($IM identify -regard-warnings -format '%wx%h' "$R/screenshot.png" 2>&1)"
  [ "$idn" = "800x352" ] && pass "screenshot 800x352, valid" || fail screenshot "identify: $idn"
  lit="$($IM convert "$R/screenshot.png" -colorspace gray -threshold 20% -format '%[fx:mean]' info: 2>&1)"
  awk "BEGIN { exit !($lit > 0.002) }" && pass "screenshot not blank ($lit lit)" || fail screenshot "$lit lit"
else
  fail report "no report.json under $REPORTS"
fi

n="$(ls "$REPORTS" 2>/dev/null | wc -l)"
$X windowfocus --sync "$XID" key F2
sleep 1
$X windowfocus --sync "$XID" key Escape
sleep 2
[ "$(ls "$REPORTS" 2>/dev/null | wc -l)" -eq "$n" ] && pass "discard writes nothing" || fail discard "a report was written"
grep -q "substratic: playtest discarded" "$WORK/game.log" && pass "discard closed the note" || fail discard "no discarded line"
[ -n "$GAME_PID" ] && kill -0 "$GAME_PID" 2>/dev/null && pass "discard does not quit" || fail discard "the game is gone"

say "artifacts in $WORK"
if [ "$FAILS" -eq 0 ]; then say GREEN; exit 0; else say "RED ($FAILS)"; exit 1; fi
