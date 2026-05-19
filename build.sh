#!/usr/bin/env bash
# Build the Chrome Web Store submission zip.
#
# Output: console-hopper.zip in the repo root.
# Excludes: .git/, dotfiles, all *.md, store-assets/, samples/, the
# previous zip itself — i.e. only the files that actually ship in the
# installed extension end up in the package.
#
# Usage: ./build.sh

set -euo pipefail

# Always run from the script's directory so a relative invocation works.
cd "$(dirname "$0")"

# Sanity: must be at the repo root (manifest.json present).
if [[ ! -f manifest.json ]]; then
  echo "error: manifest.json not found — run this from the repo root." >&2
  exit 1
fi

# Cheap manifest sanity check — fails fast if JSON is broken.
node -e 'JSON.parse(require("fs").readFileSync("manifest.json","utf8"))' >/dev/null

VERSION=$(node -e 'console.log(require("./manifest.json").version)')
NAME=$(node -e 'console.log(require("./manifest.json").name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""))')
OUT="${NAME}.zip"

echo "building ${NAME} v${VERSION} → ${OUT}"

# Remove the previous build so the new zip doesn't inherit deleted files.
rm -f "${OUT}"

# zip -q quiets per-file output; -r recurses.
zip -rq "${OUT}" . \
  -x ".git/*" \
  -x ".gitignore" \
  -x ".DS_Store" \
  -x "*.md" \
  -x "store-assets/*" \
  -x "samples/*" \
  -x "${OUT}" \
  -x "build.sh"

# Report what's inside so a typo in the excludes doesn't silently leak files.
echo
echo "=== contents ==="
unzip -l "${OUT}"
echo
echo "=== size ==="
ls -lh "${OUT}" | awk '{print $5"  "$NF}'
echo
echo "ready to upload at https://chrome.google.com/webstore/devconsole"
