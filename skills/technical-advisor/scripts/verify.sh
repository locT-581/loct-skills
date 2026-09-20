#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Technical Advisor v2.1.0 — Structural & Contract Verifier
#
# Validates skill structure, frontmatter, reference files,
# and presence of key behavioral contract elements.
#
# SAFETY: Strictly read-only, no network requests, no mutations.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SKILL_NAME="technical-advisor"
ERRORS=0
WARNINGS=0

echo "🔍 Verifying ${SKILL_NAME} v2.1.0 compliance..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILL_MD="${SKILL_ROOT}/SKILL.md"

# ─── Helper ───────────────────────────────────────────────────────────
check_pass() { echo "  ✅ Pass: $1"; }
check_fail() { echo "  ❌ Fail: $1"; ERRORS=$((ERRORS + 1)); }
check_warn() { echo "  ⚠️  Warn: $1"; WARNINGS=$((WARNINGS + 1)); }

# ─── Check 1: SKILL.md exists ─────────────────────────────────────────
echo "Check 1: SKILL.md exists"
if [ -f "${SKILL_MD}" ]; then
  check_pass "SKILL.md found"
else
  check_fail "SKILL.md not found at ${SKILL_MD}"
fi

# ─── Check 2: Frontmatter name matches ────────────────────────────────
echo "Check 2: Frontmatter name matches '${SKILL_NAME}'"
if grep -q "^name: \"${SKILL_NAME}\"" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Name matches"
else
  check_fail "Frontmatter name does not match '${SKILL_NAME}'"
fi

# ─── Check 3: Reference files exist ───────────────────────────────────
echo "Check 3: Required reference files exist"
REFS=("advisory-mode.md" "consultation-framework.md" "behavioral-tests.md")
for ref in "${REFS[@]}"; do
  if [ -f "${SKILL_ROOT}/references/${ref}" ]; then
    check_pass "references/${ref}"
  else
    check_fail "references/${ref} not found"
  fi
done

# ─── Check 4: 9 Core Invariants present ───────────────────────────────
echo "Check 4: Core invariants codified in SKILL.md"
INVARIANTS=(
  "Advisory-by-default"
  "Explicit-action gate"
  "Ambiguity.*read-only"
  "Evidence before judgment"
  "Truth-seeking critique"
  "Calibrated architecture"
  "Source discipline"
  "Evidence vs inference"
  "Privacy in research"
)
for inv in "${INVARIANTS[@]}"; do
  if grep -qE "${inv}" "${SKILL_MD}" 2>/dev/null; then
    check_pass "Invariant: ${inv}"
  else
    check_fail "Invariant missing: ${inv}"
  fi
done

# ─── Check 5: Mode controller section exists ──────────────────────────
echo "Check 5: Mode controller section"
if grep -q "Mode Controller" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Mode Controller section found"
else
  check_fail "Mode Controller section missing"
fi

# ─── Check 6: Default state is ADVISORY_READ_ONLY ─────────────────────
echo "Check 6: Default state is ADVISORY_READ_ONLY"
if grep -q "ADVISORY_READ_ONLY" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Default state ADVISORY_READ_ONLY declared"
else
  check_fail "ADVISORY_READ_ONLY default state not found"
fi

# ─── Check 7: Capability boundary section ─────────────────────────────
echo "Check 7: Capability boundary section"
if grep -q "Capability Boundary" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Capability Boundary section found"
else
  check_fail "Capability Boundary section missing"
fi

# ─── Check 8: Disallowed tools include write/edit ─────────────────────
echo "Check 8: Write/edit explicitly disallowed"
if grep -q "write/edit" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Write/edit in disallowed list"
else
  check_fail "Write/edit not explicitly in disallowed list"
fi

# ─── Check 9: Intent classification table ─────────────────────────────
echo "Check 9: Intent classification table"
if grep -q "ADVISORY" "${SKILL_MD}" 2>/dev/null && grep -q "IMPLEMENTATION" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Intent classification table with ADVISORY/IMPLEMENTATION modes"
else
  check_fail "Intent classification table missing or incomplete"
fi

# ─── Check 10: Advisory sub-modes section ─────────────────────────────
echo "Check 10: Advisory sub-modes"
SUBMODES=("EXPLAIN" "CODE_REVIEW" "ARCHITECTURE_REVIEW" "SOLUTION_EVALUATION" "RESEARCH")
submodes_found=0
for sm in "${SUBMODES[@]}"; do
  if grep -q "${sm}" "${SKILL_MD}" 2>/dev/null; then
    submodes_found=$((submodes_found + 1))
  fi
done
if [ "${submodes_found}" -eq "${#SUBMODES[@]}" ]; then
  check_pass "All 5 advisory sub-modes present"
else
  check_fail "Only ${submodes_found}/${#SUBMODES[@]} sub-modes found"
fi

# ─── Check 11: Evidence labeling requirement ──────────────────────────
echo "Check 11: Evidence labeling (Observed/Inferred/Unknown)"
if grep -q "Observed" "${SKILL_MD}" 2>/dev/null && \
   grep -q "Inferred" "${SKILL_MD}" 2>/dev/null && \
   grep -q "Unknown" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Evidence labeling triad present"
else
  check_fail "Evidence labeling (Observed/Inferred/Unknown) incomplete"
fi

# ─── Check 12: No incidental edits rule ───────────────────────────────
echo "Check 12: No incidental edits rule"
if grep -q "incidental edit" "${SKILL_MD}" 2>/dev/null; then
  check_pass "No incidental edits rule codified"
else
  check_fail "No incidental edits rule missing"
fi

# ─── Check 13: Negation precedence rule ───────────────────────────────
echo "Check 13: Negation precedence rule"
if grep -q "explicit prohibition" "${SKILL_MD}" 2>/dev/null; then
  check_pass "Negation precedence rule codified"
else
  check_fail "Negation precedence rule missing"
fi

# ─── Check 14: Line count ─────────────────────────────────────────────
echo "Check 14: SKILL.md line count under 200"
LINE_COUNT=$(wc -l < "${SKILL_MD}" | tr -d ' ')
if [ "${LINE_COUNT}" -le 200 ]; then
  check_pass "SKILL.md is ${LINE_COUNT} lines (≤ 200)"
else
  check_warn "SKILL.md is ${LINE_COUNT} lines (target ≤ 200)"
fi

# ─── Check 15: Behavioral tests file has test cases ───────────────────
echo "Check 15: Behavioral evaluation fixtures contain test cases"
BT="${SKILL_ROOT}/references/behavioral-tests.md"
if [ -f "${BT}" ]; then
  test_count=$(grep -c "^### T[0-9]" "${BT}" 2>/dev/null || echo "0")
  if [ "${test_count}" -ge 20 ]; then
    check_pass "Behavioral fixtures: ${test_count} test cases found (≥ 20)"
  else
    check_fail "Behavioral fixtures: only ${test_count} test cases (need ≥ 20)"
  fi
else
  check_fail "Behavioral fixtures file not found"
fi

# ─── Results ──────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────"
if [ "$ERRORS" -gt 0 ]; then
  echo "💥 ${ERRORS} check(s) failed, ${WARNINGS} warning(s)."
  exit 1
else
  echo "✨ All checks passed for ${SKILL_NAME} v2.1.0! (${WARNINGS} warning(s))"
  exit 0
fi
