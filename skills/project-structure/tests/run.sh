#!/usr/bin/env bash
# run.sh — Regression test runner for verify.sh
# Runs verify.sh against each fixture directory and asserts exit code.
#
# Usage: bash tests/run.sh
# Exit 0 = all tests pass, Exit 1 = failures found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "${SCRIPT_DIR}")"
VERIFY="${SKILL_DIR}/scripts/verify.sh"

TOTAL=0
PASSED=0
FAILED=0

run_test() {
  local fixture_dir="$1"
  local expected_exit="$2"
  local test_name
  test_name="$(basename "$(dirname "${fixture_dir}")")/$(basename "${fixture_dir}")"

  TOTAL=$((TOTAL + 1))

  # Run verify.sh, capture exit code
  local actual_exit=0
  bash "${VERIFY}" "${fixture_dir}" > /dev/null 2>&1 || actual_exit=$?

  if [[ "${actual_exit}" -eq "${expected_exit}" ]]; then
    printf "  ✅ %-45s (exit %d)\n" "${test_name}" "${actual_exit}"
    PASSED=$((PASSED + 1))
  else
    printf "  ❌ %-45s (expected %d, got %d)\n" "${test_name}" "${expected_exit}" "${actual_exit}"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== verify.sh Regression Tests ==="
echo ""

# --- Valid fixtures (expect exit 0) ---
echo "--- Valid Fixtures (expect PASS) ---"
for dir in "${SCRIPT_DIR}"/valid/*/; do
  [[ -d "${dir}" ]] && run_test "${dir}" 0
done

# --- Invalid fixtures (expect exit 1) ---
echo ""
echo "--- Invalid Fixtures (expect FAIL) ---"
for dir in "${SCRIPT_DIR}"/invalid/*/; do
  [[ -d "${dir}" ]] && run_test "${dir}" 1
done

# --- Summary ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: ${TOTAL}  Passed: ${PASSED}  Failed: ${FAILED}"

if [[ "${FAILED}" -eq 0 ]]; then
  echo "✨ All regression tests passed!"
  exit 0
else
  echo "💥 ${FAILED} test(s) failed!"
  exit 1
fi
