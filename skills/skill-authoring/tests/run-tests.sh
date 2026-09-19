#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Skill Authoring — Validator Test Suite
#
# Runs validate.py against fixture directories structured in
# canonical paths so path-based type detection is tested too:
#
#   valid/skills/<name>/          → registry, expect exit 0
#   valid/.agent/skills/<name>/   → workspace, expect exit 0
#   invalid/skills/<name>/        → registry, expect exit 1
#
# Usage:
#   bash tests/run-tests.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VALIDATOR="${SKILL_ROOT}/tools/validate.py"

PASSED=0
FAILED=0
TOTAL=0

# Verify deps are available
if ! python3 -c 'import yaml, jsonschema' 2>/dev/null; then
  echo "❌ Missing Python dependencies: pyyaml and/or jsonschema"
  echo "   Install: pip install pyyaml jsonschema"
  exit 2
fi

if [ ! -f "$VALIDATOR" ]; then
  echo "❌ validate.py not found at ${VALIDATOR}"
  exit 2
fi

run_test() {
  local fixture_dir="$1"
  local expect_exit="$2"  # 0 = should pass, 1 = should fail
  local fixture_name
  fixture_name=$(basename "$fixture_dir")

  TOTAL=$((TOTAL + 1))

  # Run validator, capture exit code, suppress output
  local actual_exit=0
  python3 "${VALIDATOR}" "${fixture_dir}" > /dev/null 2>&1 || actual_exit=$?

  if [ "$actual_exit" -eq "$expect_exit" ]; then
    PASSED=$((PASSED + 1))
    echo "  ✅ ${fixture_name} — exit ${actual_exit} (expected ${expect_exit})"
  else
    FAILED=$((FAILED + 1))
    echo "  ❌ ${fixture_name} — exit ${actual_exit} (expected ${expect_exit})"
    # Show output for debugging
    echo "     ── validator output ──"
    python3 "${VALIDATOR}" "${fixture_dir}" 2>&1 | sed 's/^/     /' || true
    echo "     ──────────────────────"
  fi
}

echo "🧪 Skill Authoring — Validator Test Suite"
echo ""

# ─── Valid fixtures (must exit 0) ─────────────────────────────────────
# Find all SKILL.md under valid/, derive skill dir from parent
echo "Valid fixtures (expect exit 0):"
while IFS= read -r skill_md; do
  dir=$(dirname "$skill_md")
  run_test "$dir" 0
done < <(find "${SCRIPT_DIR}/valid" -name "SKILL.md" | sort)
echo ""

# ─── Invalid fixtures (must exit 1) ──────────────────────────────────
echo "Invalid fixtures (expect exit 1):"
while IFS= read -r skill_md; do
  dir=$(dirname "$skill_md")
  run_test "$dir" 1
done < <(find "${SCRIPT_DIR}/invalid" -name "SKILL.md" | sort)
echo ""

# ─── Results ──────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAILED" -gt 0 ]; then
  echo "💥 ${PASSED}/${TOTAL} passed, ${FAILED} FAILED"
  exit 1
else
  echo "✨ ${PASSED}/${TOTAL} tests passed!"
  exit 0
fi
