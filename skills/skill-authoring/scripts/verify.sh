#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Skill Authoring — Skill Directory Validator (wrapper)
#
# Runs tools/validate.py using python3. Does NOT install
# dependencies or make network requests.
#
# Prerequisites (run once):
#   pip install pyyaml jsonschema
#   # or: uv pip install pyyaml jsonschema
#
# Usage:
#   bash scripts/verify.sh <skill-directory>
#   bash scripts/verify.sh --type registry <skill-directory>
#
# SAFETY: This script is strictly read-only. No network.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATOR="${SCRIPT_DIR}/../tools/validate.py"

if [ ! -f "$VALIDATOR" ]; then
  echo "❌ validate.py not found at ${VALIDATOR}"
  exit 2
fi

# Check python3 exists
if ! command -v python3 &>/dev/null; then
  echo "❌ python3 not found. Install Python 3.10+ first."
  exit 2
fi

# Check dependencies are installed (no network, no auto-install)
if ! python3 -c 'import yaml, jsonschema' 2>/dev/null; then
  echo "❌ Missing Python dependencies: pyyaml and/or jsonschema"
  echo ""
  echo "   Install them once (pick one):"
  echo "     pip install pyyaml jsonschema"
  echo "     uv pip install pyyaml jsonschema"
  echo ""
  echo "   Then re-run this script."
  exit 2
fi

exec python3 "$VALIDATOR" "$@"
