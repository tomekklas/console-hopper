#!/usr/bin/env bash
# Capture the staged role-picker scene and write a 1280x800 store screenshot.
#
#   shoot.sh <chrome-window-id> <out.png> [scene]
#
# scene: main (default) | sets | edit | sessions | dark | room[:N] — see stage.js.
#
# Everything that needs Chrome focused happens in ONE shell call: activating
# Chrome from a separate call hands focus back to the terminal and you
# screenshot that instead. stage.js runs after activation because the extension
# focuses its search box on window-activate, which pops the search card open
# over the shot; it also returns the crop rect to capture and refuses the shot
# if any real account data is still legible.
set -euo pipefail

WIN="$1"
OUT="$2"
SCENE="${3:-main}"
SCRATCH="$(cd "$(dirname "$0")" && pwd)"
VW=1280
VH=802

# Hold the display awake; a locked or sleeping screen makes screencapture fail
# with "could not create image from rect", or return a solid black frame.
caffeinate -d -u -t 90 &
CAFF=$!
trap 'kill $CAFF 2>/dev/null || true' EXIT

# Park the OS cursor below the frame — and NOT at the right edge: this display
# is only 1280 wide, so a large x clamps onto the extension's right-edge hover
# zone and slides the side menu into the shot.
python3 - <<'PY'
import ctypes
cg = ctypes.cdll.LoadLibrary(
    "/System/Library/Frameworks/ApplicationServices.framework/ApplicationServices")
class P(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double)]
cg.CGWarpMouseCursorPosition(P(640.0, 2100.0))
PY

out=$(osascript <<OSA
set js to "var SCENE = \"$SCENE\";" & (read POSIX file "$SCRATCH/stage.js" as «class utf8»)
set probe to "JSON.stringify({sx:window.screenX,sy:window.screenY,iw:innerWidth,ih:innerHeight,oh:outerHeight})"
tell application "Google Chrome"
  activate
  set w to window id $WIN
  set index of w to 1
  -- two passes: size the OUTER window, then correct for the window chrome so
  -- the INNER viewport lands on exactly ${VW}x${VH}
  set bounds of w to {0, 120, $VW, 120 + $VH + 121}
  delay 0.4
  set m to execute (active tab of w) javascript probe
  set AppleScript's text item delimiters to {"\"iw\":", ",\"ih\":", ",\"oh\":"}
  set iw to (text item 2 of m) as integer
  set ih to (text item 3 of m) as integer
  set AppleScript's text item delimiters to {""}
  set bounds of w to {0, 120, $VW + ($VW - iw), 120 + $VH + 121 + ($VH - ih)}
  -- Bringing the window forward makes the picker re-read its sessions; let
  -- that land before staging, or it repaints real data over the staged text.
  delay 3
  -- Three passes: the first opens the scene (some of it — the sessions list,
  -- the row refit — arrives asynchronously), the second rewrites whatever
  -- appeared since, and the third, right before the capture, re-pins the
  -- staged text and runs the leak check on the final frame.
  execute (active tab of w) javascript js
  delay 2.5
  execute (active tab of w) javascript js
  delay 0.5
  set stageOut to execute (active tab of w) javascript js
  set geomOut to execute (active tab of w) javascript probe
  return geomOut & "@@" & stageOut
end tell
OSA
)
geom="${out%%@@*}"
stage="${out##*@@}"
echo "stage: $stage"

rect=$(python3 - "$geom" "$stage" <<'PY'
import json, sys
g, s = json.loads(sys.argv[1]), json.loads(sys.argv[2])
if s.get("leaks"):
    sys.exit("REFUSING: real data still visible: %s" % s["leaks"])
if not s.get("framing", {}).get("ok"):
    sys.exit("REFUSING: framing not ok: %s" % s.get("framing"))
shot = s["framing"]["shot"]
vx, vy = int(g["sx"]), int(g["sy"] + (g["oh"] - g["ih"]))
print(vx + shot["x"], vy + shot["y"], shot["w"], shot["h"])
PY
)
read -r X Y W H <<<"$rect"
echo "capture rect: ${X},${Y} ${W}x${H}"

screencapture -x -R"${X},${Y},${W},${H}" "$SCRATCH/raw.png"
# already exactly 1280x800 — copy, don't resample
cp "$SCRATCH/raw.png" "$OUT"
sips -g pixelWidth -g pixelHeight "$OUT" | tail -2
