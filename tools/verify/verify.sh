#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "${BASH_SOURCE[0]%/*}/../.." && pwd)"

echo "Running lint on affected scope..."
npx nx affected --target=lint --parallel || {
  echo "── lint failed ──" >&2
  exit 1
}

echo "Running i18n parity/hardcoded-literal check..."
node "$REPO_ROOT/tools/verify/check-i18n.mjs" || {
  echo "── i18n check failed ──" >&2
  exit 1
}

echo "All checks passed."
