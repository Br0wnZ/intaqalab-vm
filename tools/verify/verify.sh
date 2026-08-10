#!/bin/bash
# Thin wrapper — delegates to the cross-platform Node script
node "$(dirname "$0")/verify.mjs"
