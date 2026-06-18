#!/bin/bash
set -euo pipefail

echo "Running lint on affected scope..."
npx nx affected --target=lint --parallel || { 
  echo "── lint failed ──" >&2
  exit 1
}

echo "All checks passed."
