#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Skill Authoring — Skill Directory Validator (wrapper)
#
# Thin wrapper around validate.py. Tries uv first, falls back
# to python3 if deps are already installed.
#
# Usage:
#   bash scripts/verify.sh <skill-directory>
#
# SAFETY: This script is strictly read-only.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATOR="${SCRIPT_DIR}/validate.py"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <skill-directory>"
  exit 2
fi

if [ ! -f "$VALIDATOR" ]; then
  echo "❌ validate.py not found at ${VALIDATOR}"
  exit 2
fi

# Try uv first (handles dependencies automatically)
if command -v uv &>/dev/null; then
  exec uv run --no-cache "$VALIDATOR" "$@"
fi

# Fallback: try python3 directly (requires pyyaml + jsonschema installed)
if command -v python3 &>/dev/null; then
  echo "⚠️  uv not found, trying python3 directly (requires pyyaml + jsonschema)..."
  exec python3 "$VALIDATOR" "$@"
fi

echo "❌ Neither uv nor python3 found. Install uv: https://docs.astral.sh/uv/"
exit 2
