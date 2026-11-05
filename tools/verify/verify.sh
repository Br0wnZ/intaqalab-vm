#!/bin/bash
# Thin wrapper — delegates to the cross-platform Node script with arguments
node "$(dirname "$0")/verify.mjs" "$@"
