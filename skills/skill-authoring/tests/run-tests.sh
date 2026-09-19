#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Skill Authoring — Validator Test Suite
#
# Runs validate.py against fixture directories and checks that
# valid fixtures pass (exit 0) and invalid fixtures fail (exit 1).
#
# Usage:
#   bash tests/run-tests.sh
#
# Must be run from the skill-authoring/ directory.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VALIDATOR="${SKILL_ROOT}/scripts/validate.py"

PASSED=0
FAILED=0
TOTAL=0

# Resolve validator runner
if command -v uv &>/dev/null; then
  RUN_CMD="uv run --no-cache"
else
  RUN_CMD="python3"
fi

run_test() {
  local fixture_dir="$1"
  local expect_exit="$2"  # 0 = should pass, 1 = should fail
  local fixture_name
  fixture_name=$(basename "$fixture_dir")

  TOTAL=$((TOTAL + 1))

  # Run validator, capture exit code, suppress output
  local actual_exit=0
  ${RUN_CMD} "${VALIDATOR}" "${fixture_dir}" > /dev/null 2>&1 || actual_exit=$?

  if [ "$actual_exit" -eq "$expect_exit" ]; then
    PASSED=$((PASSED + 1))
    echo "  ✅ ${fixture_name} — exit ${actual_exit} (expected ${expect_exit})"
  else
    FAILED=$((FAILED + 1))
    echo "  ❌ ${fixture_name} — exit ${actual_exit} (expected ${expect_exit})"
    # Show output for debugging
    echo "     ── validator output ──"
    ${RUN_CMD} "${VALIDATOR}" "${fixture_dir}" 2>&1 | sed 's/^/     /' || true
    echo "     ──────────────────────"
  fi
}

echo "🧪 Skill Authoring — Validator Test Suite"
echo ""

# ─── Valid fixtures (must exit 0) ─────────────────────────────────────
echo "Valid fixtures (expect exit 0):"
for dir in "${SCRIPT_DIR}"/valid/*/; do
  [ -d "$dir" ] || continue
  run_test "$dir" 0
done
echo ""

# ─── Invalid fixtures (must exit 1) ──────────────────────────────────
echo "Invalid fixtures (expect exit 1):"
for dir in "${SCRIPT_DIR}"/invalid/*/; do
  [ -d "$dir" ] || continue
  run_test "$dir" 1
done
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
