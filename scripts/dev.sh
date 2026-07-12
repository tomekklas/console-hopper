#!/usr/bin/env bash
# Rebuild the extension and (re)launch the local mock-saml IdP for demo testing.
#
#   npm run dev            # build + restart mock-saml on :4000
#   MOCK_SAML_DIR=~/elsewhere/mock-saml npm run dev
#
# After it's up: reload Console Hopper on chrome://extensions (it loads from
# dist/), then open http://localhost:4000 and sign in against the AWS ACS URL.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MOCK_SAML_DIR="${MOCK_SAML_DIR:-$HOME/Dev/mock-saml}"

if [[ ! -d "$MOCK_SAML_DIR" ]]; then
  echo "mock-saml not found at $MOCK_SAML_DIR (set MOCK_SAML_DIR to override)" >&2
  exit 1
fi

echo "==> Building extension"
(cd "$REPO_DIR" && npm run build)

echo "==> Freeing port 4000"
lsof -ti:4000 | xargs kill 2>/dev/null || true

echo "==> Starting mock-saml at http://localhost:4000 (Ctrl+C to stop)"
echo "    Reload Console Hopper on chrome://extensions to pick up the new build."
cd "$MOCK_SAML_DIR" && exec npm run dev
