#!/bin/sh
# Native live reload, driven headless (procedures/headless-native-drive-with-xvfb):
# the release binary plays a COPY of world/ on a private Xvfb; the drive
# edits a room file in the copy and checks that the running game reloads it.
#
#   scripts/drive-reload.sh DISPLAY-NUMBER OUT-DIR
#
# The Xvfb must already be listening on :DISPLAY-NUMBER, started from a
# detached tmux window (an X server started from the tool sandbox never
# serves a client):
#   tmux new-window -d -t ops -n a1-xvfb 'guix shell xorg-server -- Xvfb :117 -screen 0 1400x900x24 +extension GLX -nolisten tcp'
#
# Legs, each printing PASS or FAIL:
#   boot      the game says "harkfell: room reedfen:9,3" and its window is found
#   reload    the Reed Bridge's plank bridge (row 6) becomes rock in the copy:
#             the game prints "harkfell: reloaded world/rooms/reedfen/x9y3.room"
#             within 3 s, and the window's picture changes
#   refuse    a row of the same room is cut to 24 characters: the game prints
#             "harkfell: NOT reloaded" with the file and line, keeps running,
#             and the window's picture does not change
# The game is stopped by its own PID (exe = the release binary, cwd = this
# worktree), never by pattern. Nothing under the repo is written: the world
# copy, the captures and the game's store live in OUT-DIR.
set -u
cd "$(dirname "$0")/.." || exit 2
N="$1"; OUT="$2"
BIN="$PWD/build/release/bin/harkfell"
[ -x "$BIN" ] || { echo "SETUP-FAILED: $BIN missing"; exit 2; }
[ -S "/tmp/.X11-unix/X$N" ] || { echo "SETUP-FAILED: no X server on :$N"; exit 2; }
mkdir -p "$OUT"
W="$OUT/world"
rm -rf "$W" && cp -r world "$W"
ROOM="$W/rooms/reedfen/x9y3.room"
export DISPLAY=":$N" SIGIL_APP_PLATFORM=x11 XDG_DATA_HOME="$OUT/xdg"
unset WAYLAND_DISPLAY
LOG="$OUT/game.log"
: > "$LOG"
guix shell mesa libx11 libxi libxcursor libxrandr libxinerama -- "$BIN" --world "$W" --room reedfen:9,3 > "$LOG" 2>&1 &
sleep 1
# the game's own PID: exe is the binary and cwd is this worktree
GPID=""
for p in $(ls /proc | grep -E '^[0-9]+$'); do
  [ "$p" = "$$" ] && continue
  [ "$(readlink /proc/$p/exe 2>/dev/null)" = "$BIN" ] || continue
  [ "$(readlink /proc/$p/cwd 2>/dev/null)" = "$PWD" ] || continue
  GPID=$p
done
stop() { [ -n "$GPID" ] && kill "$GPID" 2>/dev/null; }
trap stop EXIT
[ -n "$GPID" ] || { echo "SETUP-FAILED: the game did not start"; cat "$LOG"; exit 2; }
echo "game pid $GPID"
X() { guix shell xdotool -- xdotool "$@"; }
shot() { guix shell imagemagick -- import -window "$XID" "$1" 2>/dev/null; guix shell imagemagick -- identify -format '%#' "$1"; }
i=0; XID=""
while [ $i -lt 30 ] && [ -z "$XID" ]; do XID=$(X search --name Harkfell 2>/dev/null | head -1); i=$((i+1)); sleep 1; done
fails=0
if grep -q "harkfell: room reedfen:9,3" "$LOG" && [ -n "$XID" ]; then echo "PASS boot: window $XID"; else echo "FAIL boot"; cat "$LOG"; exit 1; fi
sleep 3
H0=$(shot "$OUT/before.png"); echo "before: $H0"

# reload: the bridge becomes rock
sed -i 's/"         =======         "/"         #######         "/' "$ROOM"
grep -q '"         #######         "' "$ROOM" || { echo "SETUP-FAILED: the reload plant did not land"; exit 2; }
i=0; while [ $i -lt 6 ] && ! grep -q "reloaded world/rooms/reedfen/x9y3.room" "$LOG"; do sleep 0.5; i=$((i+1)); done
sleep 1
H1=$(shot "$OUT/after-reload.png"); echo "after reload: $H1"
if grep -q "harkfell: reloaded world/rooms/reedfen/x9y3.room" "$LOG" && [ "$H0" != "$H1" ]; then
  echo "PASS reload: the line printed and the picture changed"
else echo "FAIL reload"; fails=$((fails+1)); fi

# refuse: a 24-character row
sed -i 's/"   ||  |         |  ||   "/"   ||  |         |  ||  "/' "$ROOM"
grep -q '"   ||  |         |  ||  "' "$ROOM" || { echo "SETUP-FAILED: the refuse plant did not land"; exit 2; }
i=0; while [ $i -lt 6 ] && ! grep -q "NOT reloaded" "$LOG"; do sleep 0.5; i=$((i+1)); done
sleep 1
H2=$(shot "$OUT/after-refuse.png"); echo "after refuse: $H2"
if grep -q "harkfell: NOT reloaded world/rooms/reedfen/x9y3.room" "$LOG" && grep -q "x9y3.room:16: grid row 7 is 24 characters" "$LOG" \
   && [ "$H1" = "$H2" ] && [ -d "/proc/$GPID" ]; then
  echo "PASS refuse: the problem named, the picture held, the game still running"
else echo "FAIL refuse"; fails=$((fails+1)); fi
echo "--- game log"; cat "$LOG"
[ $fails -eq 0 ] && echo "PASS drive-reload" || echo "FAIL drive-reload: $fails legs"
exit $fails
