#!/usr/bin/env bash
# verify.sh — Structure Map Contract Verifier
# Validates that structure-map.md exists, has correct format,
# all authority sources and placement rules carry valid typed
# provenance, documents exist within repo boundaries, authority
# documents are not symlinks, and no conflicting authoritative
# rules exist.
#
# Usage: bash .skills/project-structure/scripts/verify.sh [project-root]
# Exit 0 = all checks pass, Exit 1 = failures found

set -euo pipefail

# --- Configuration ---
PROJECT_ROOT="${1:-.}"
STRUCTURE_MAP="${PROJECT_ROOT}/structure-map.md"
EXIT_CODE=0
VALID_STATUSES="documented confirmed observed inferred"
VALID_PREFIXES="doc: instruction: user:"

# Resolve repo root (git-based or fallback to PROJECT_ROOT)
if REPO_ROOT=$(cd "${PROJECT_ROOT}" && git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT=$(cd "${REPO_ROOT}" && pwd)
else
  REPO_ROOT=$(cd "${PROJECT_ROOT}" && pwd)
fi

# --- Helpers ---
pass() { printf "  ✅ %s\n" "$1"; }
fail() { printf "  ❌ %s\n" "$1"; EXIT_CODE=1; }
warn() { printf "  ⚠️  %s\n" "$1"; }
info() { printf "  ℹ️  %s\n" "$1"; }

# Separator-aware repo boundary check (not just string prefix)
path_within_repo() {
  local base="$1"
  local relpath="$2"
  local target="${base}/${relpath}"

  [[ -f "${target}" ]] || return 0  # non-existent files caught separately

  local resolved
  resolved="$(cd "$(dirname "${target}")" && pwd)/$(basename "${relpath}")"

  # Must match exactly REPO_ROOT or start with REPO_ROOT/
  case "${resolved}" in
    "${REPO_ROOT}"|"${REPO_ROOT}/"*) return 0 ;;
    *) return 1 ;;
  esac
}

# Check if a relative path escapes its root via ../ traversal
path_escapes_root() {
  local path="$1"
  local depth=0
  local IFS='/'
  for seg in $path; do
    case "$seg" in
      ..) depth=$((depth - 1)) ;;
      .|'') ;;
      *) depth=$((depth + 1)) ;;
    esac
    [[ "$depth" -lt 0 ]] && return 0  # escapes
  done
  return 1  # stays within
}

echo "=== Structure Map Contract Verifier ==="
echo "Project root: ${PROJECT_ROOT}"
echo "Repo root:    ${REPO_ROOT}"
echo ""

# --- Check 1: structure-map.md exists ---
echo "--- File Existence ---"
if [[ -f "${STRUCTURE_MAP}" ]]; then
  pass "structure-map.md exists"
else
  fail "structure-map.md not found at project root"
  info "Run the project-structure skill to generate it"
  echo ""
  echo "Result: FAIL ❌"
  exit 1
fi

# --- Check 2: Required sections exist ---
echo ""
echo "--- Required Sections ---"

if grep -qi "## Authority Sources" "${STRUCTURE_MAP}"; then
  pass "Section 'Authority Sources' found"
else
  fail "Missing section: '## Authority Sources'"
fi

if grep -qi "## Placement Rules" "${STRUCTURE_MAP}"; then
  pass "Section 'Placement Rules' found"
else
  fail "Missing section: '## Placement Rules'"
fi

if grep -qi "## Naming Defaults" "${STRUCTURE_MAP}"; then
  pass "Section 'Naming Defaults' found"
else
  fail "Missing section: '## Naming Defaults'"
fi

# --- Check 3: Authority Sources — validate every entry independently ---
echo ""
echo "--- Authority Sources ---"

AUTHORITY_SECTION=$(sed -n '/## Authority Sources/,/^## /p' "${STRUCTURE_MAP}" | tail -n +2)
AUTHORITY_RAW=$(echo "${AUTHORITY_SECTION}" | grep '^\s*[-*]' || true)
AUTHORITY_ENTRIES=$(echo "${AUTHORITY_RAW}" | grep -c '.' || true)

if [[ "${AUTHORITY_ENTRIES}" -ge 1 ]]; then
  pass "Authority Sources has ${AUTHORITY_ENTRIES} source(s) listed"
else
  fail "Authority Sources section is empty — list documents or user confirmations"
fi

# Parse and validate each authority entry independently
AUTH_REFS=""
AUTH_ERRORS=0
if [[ -n "${AUTHORITY_RAW}" ]]; then
  while IFS= read -r line; do
    REF=$(echo "${line}" | sed 's/^\s*[-*]\s*//' | sed 's/\s*(last checked.*//' | xargs)
    [[ -z "${REF}" ]] && continue

    # Prefix validation
    HAS_VALID_PREFIX=0
    for prefix in ${VALID_PREFIXES}; do
      if [[ "${REF}" == ${prefix}* ]]; then
        HAS_VALID_PREFIX=1
        break
      fi
    done

    if [[ "${HAS_VALID_PREFIX}" -eq 0 ]]; then
      fail "Authority Source '${REF}' has invalid prefix — must start with doc:, instruction:, or user:"
      AUTH_ERRORS=$((AUTH_ERRORS + 1))
      AUTH_REFS="${AUTH_REFS}${REF}"$'\n'
      continue
    fi

    # Validate entry based on type
    if [[ "${REF}" == doc:* || "${REF}" == instruction:* ]]; then
      local_path="${REF#*:}"
      if [[ -z "${local_path}" ]]; then
        fail "Authority Source '${REF}' has empty path"
        AUTH_ERRORS=$((AUTH_ERRORS + 1))
      elif [[ ! -f "${PROJECT_ROOT}/${local_path}" ]]; then
        fail "Authority Source '${REF}' — file does not exist"
        AUTH_ERRORS=$((AUTH_ERRORS + 1))
      elif [[ -L "${PROJECT_ROOT}/${local_path}" ]]; then
        fail "Authority Source '${REF}' — file is a symbolic link (authority documents must not be symlinks)"
        AUTH_ERRORS=$((AUTH_ERRORS + 1))
      elif ! path_within_repo "${PROJECT_ROOT}" "${local_path}"; then
        fail "Authority Source '${REF}' — file escapes repository root"
        AUTH_ERRORS=$((AUTH_ERRORS + 1))
      fi
    elif [[ "${REF}" == user:* ]]; then
      context="${REF#user:}"
      if [[ -z "${context}" ]]; then
        fail "Authority Source '${REF}' has empty context — use 'user:<date-or-description>'"
        AUTH_ERRORS=$((AUTH_ERRORS + 1))
      fi
    fi

    AUTH_REFS="${AUTH_REFS}${REF}"$'\n'
  done <<< "${AUTHORITY_RAW}"

  if [[ "${AUTH_ERRORS}" -eq 0 ]]; then
    pass "All Authority Sources entries are valid"
  fi
fi

# --- Check 4: Placement Rules table is not empty ---
echo ""
echo "--- Placement Rules Table ---"

RULES_SECTION=$(sed -n '/## Placement Rules/,/^## /p' "${STRUCTURE_MAP}" | tail -n +2)
TABLE_ROWS=$(echo "${RULES_SECTION}" | grep -c '^|' || true)

if [[ "${TABLE_ROWS}" -ge 3 ]]; then
  DATA_ROWS=$((TABLE_ROWS - 2))
  pass "Placement Rules table has ${DATA_ROWS} rule(s)"
else
  fail "Placement Rules table is empty or missing — add at least one mapping"
fi

# --- Check 5: Typed provenance validation ---
echo ""
echo "--- Provenance Validation ---"

DATA_LINES=$(echo "${RULES_SECTION}" | grep '^|' | tail -n +3 || true)

if [[ -n "${DATA_LINES}" ]]; then
  INVALID_STATUS=0
  HAS_AUTHORITATIVE=0
  PROVENANCE_ERRORS=0

  # Helper: check if source is in AUTH_REFS
  source_in_authority() {
    local src="$1"
    if [[ -n "${AUTH_REFS}" ]]; then
      while IFS= read -r ref; do
        [[ -z "${ref}" ]] && continue
        if [[ "${ref}" == "${src}" ]]; then
          return 0
        fi
      done <<< "${AUTH_REFS}"
    fi
    return 1
  }

  while IFS= read -r row; do
    STATUS=$(echo "${row}" | awk -F'|' '{print $7}' | xargs)
    SOURCE=$(echo "${row}" | awk -F'|' '{print $6}' | xargs)
    SCOPE=$(echo "${row}" | awk -F'|' '{print $2}' | xargs)
    FILETYPE=$(echo "${row}" | awk -F'|' '{print $3}' | xargs)
    LABEL="[${SCOPE} / ${FILETYPE}]"

    # 5a: Status must be valid enum
    FOUND=0
    for valid in ${VALID_STATUSES}; do
      if [[ "${STATUS}" == "${valid}" ]]; then
        FOUND=1
        break
      fi
    done

    if [[ "${FOUND}" -eq 0 ]]; then
      fail "Invalid Status '${STATUS}' for ${LABEL} — must be one of: ${VALID_STATUSES}"
      INVALID_STATUS=$((INVALID_STATUS + 1))
      continue
    fi

    # 5b: Status↔prefix agreement + referential integrity
    # File existence, symlink, and boundary checks are now in Check 3 (Authority Sources).
    # Here we only verify: prefix match, Source ∈ AUTH_REFS, non-empty values.
    case "${STATUS}" in
      documented)
        HAS_AUTHORITATIVE=1
        if [[ -z "${SOURCE}" ]]; then
          fail "Empty Source for ${LABEL} with Status 'documented'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        elif [[ "${SOURCE}" != doc:* ]]; then
          fail "Source '${SOURCE}' for ${LABEL} must start with 'doc:' when Status is 'documented'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        elif ! source_in_authority "${SOURCE}"; then
          fail "Source '${SOURCE}' for ${LABEL} not listed in Authority Sources"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        fi
        ;;
      confirmed)
        HAS_AUTHORITATIVE=1
        if [[ -z "${SOURCE}" ]]; then
          fail "Empty Source for ${LABEL} with Status 'confirmed'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        elif [[ "${SOURCE}" == user:* ]]; then
          CONTEXT="${SOURCE#user:}"
          if [[ -z "${CONTEXT}" ]]; then
            fail "Empty context in '${SOURCE}' for ${LABEL} — use 'user:<date-or-description>'"
            PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
          elif ! source_in_authority "${SOURCE}"; then
            fail "Source '${SOURCE}' for ${LABEL} not listed in Authority Sources"
            PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
          fi
        elif [[ "${SOURCE}" == instruction:* ]]; then
          if ! source_in_authority "${SOURCE}"; then
            fail "Source '${SOURCE}' for ${LABEL} not listed in Authority Sources"
            PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
          fi
        else
          fail "Source '${SOURCE}' for ${LABEL} must start with 'user:' or 'instruction:' when Status is 'confirmed'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        fi
        ;;
      observed)
        if [[ -z "${SOURCE}" ]]; then
          fail "Empty Source for ${LABEL} with Status 'observed'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        elif [[ "${SOURCE}" != observed:* ]]; then
          fail "Source '${SOURCE}' for ${LABEL} must start with 'observed:' when Status is 'observed'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        else
          DESC="${SOURCE#observed:}"
          if [[ -z "${DESC}" ]]; then
            fail "Empty description in '${SOURCE}' for ${LABEL}"
            PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
          fi
        fi
        ;;
      inferred)
        if [[ -z "${SOURCE}" ]]; then
          fail "Empty Source for ${LABEL} with Status 'inferred'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        elif [[ "${SOURCE}" != inference:* ]]; then
          fail "Source '${SOURCE}' for ${LABEL} must start with 'inference:' when Status is 'inferred'"
          PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
        else
          DESC="${SOURCE#inference:}"
          if [[ -z "${DESC}" ]]; then
            fail "Empty description in '${SOURCE}' for ${LABEL}"
            PROVENANCE_ERRORS=$((PROVENANCE_ERRORS + 1))
          fi
        fi
        ;;
    esac
  done <<< "${DATA_LINES}"

  if [[ "${INVALID_STATUS}" -eq 0 ]]; then
    pass "All rules have valid Status values"
  fi

  if [[ "${PROVENANCE_ERRORS}" -eq 0 ]]; then
    pass "All rules have valid typed provenance"
  fi

  if [[ "${HAS_AUTHORITATIVE}" -eq 1 ]]; then
    pass "At least one authoritative rule (documented/confirmed) exists"
  else
    warn "No authoritative rules found — only observed/inferred rules cannot authorize file creation"
  fi
else
  info "No data rows to validate"
fi

# --- Check 6: Conflicting authoritative rules (awk-based, includes Naming) ---
echo ""
echo "--- Conflict Detection ---"

if [[ -n "${DATA_LINES}" ]]; then
  # Conflict = same (Scope, FileType) key but different (TargetDir, Naming) value
  CONFLICTS=$(echo "${DATA_LINES}" | awk -F'|' '
  {
    status = $7; gsub(/^[ \t]+|[ \t]+$/, "", status)
    if (status == "documented" || status == "confirmed") {
      scope = $2; gsub(/^[ \t]+|[ \t]+$/, "", scope)
      ftype = $3; gsub(/^[ \t]+|[ \t]+$/, "", ftype)
      target = $4; gsub(/^[ \t]+|[ \t]+$/, "", target)
      naming = $5; gsub(/^[ \t]+|[ \t]+$/, "", naming)
      key = scope SUBSEP ftype
      if (key in seen_target) {
        if (seen_target[key] != target || seen_naming[key] != naming) {
          printf "CONFLICT\t%s\t%s\t%s\t%s\t%s\t%s\n", scope, ftype, seen_target[key], seen_naming[key], target, naming
        }
      } else {
        seen_target[key] = target
        seen_naming[key] = naming
      }
    }
  }')

  if [[ -n "${CONFLICTS}" ]]; then
    while IFS=$'\t' read -r _ scope ftype old_target old_naming new_target new_naming; do
      fail "Conflicting authoritative rules for [${scope} / ${ftype}]: ${old_target} (${old_naming}) vs ${new_target} (${new_naming})"
    done <<< "${CONFLICTS}"
  else
    pass "No conflicting authoritative rules detected"
  fi
else
  info "No data rows to check for conflicts"
fi

# --- Check 7: Target Directory path safety ---
echo ""
echo "--- Target Path Safety ---"

if [[ -n "${DATA_LINES}" ]]; then
  TARGET_ERRORS=0

  while IFS= read -r row; do
    RAW_TARGET=$(echo "${row}" | awk -F'|' '{print $4}' | xargs)
    SCOPE=$(echo "${row}" | awk -F'|' '{print $2}' | xargs)
    FILETYPE=$(echo "${row}" | awk -F'|' '{print $3}' | xargs)
    LABEL="[${SCOPE} / ${FILETYPE}]"

    # Strip backticks
    TARGET="${RAW_TARGET//\`/}"
    [[ -z "${TARGET}" ]] && continue

    # Skip template paths with <placeholders> for traversal check
    # but still validate absolute path and trailing slash
    HAS_PLACEHOLDER=0
    [[ "${TARGET}" == *"<"* ]] && HAS_PLACEHOLDER=1

    # Must not be absolute
    if [[ "${TARGET}" == /* ]]; then
      fail "Target '${RAW_TARGET}' for ${LABEL} is an absolute path — must be relative"
      TARGET_ERRORS=$((TARGET_ERRORS + 1))
      continue
    fi

    # Must end with /
    if [[ "${TARGET}" != */ ]]; then
      fail "Target '${RAW_TARGET}' for ${LABEL} must end with '/'"
      TARGET_ERRORS=$((TARGET_ERRORS + 1))
    fi

    # Must not escape project root via ../
    if [[ "${HAS_PLACEHOLDER}" -eq 0 ]] && path_escapes_root "${TARGET}"; then
      fail "Target '${RAW_TARGET}' for ${LABEL} escapes project root via ../ traversal"
      TARGET_ERRORS=$((TARGET_ERRORS + 1))
    fi
  done <<< "${DATA_LINES}"

  if [[ "${TARGET_ERRORS}" -eq 0 ]]; then
    pass "All target paths are safe and canonical"
  fi
else
  info "No data rows to check target paths"
fi

# --- Check 8: No placeholder text remaining ---
echo ""
echo "--- Placeholder Check ---"

if grep -q '{{' "${STRUCTURE_MAP}"; then
  PLACEHOLDERS=$(grep -c '{{' "${STRUCTURE_MAP}" || true)
  fail "Found ${PLACEHOLDERS} unfilled placeholder(s) — replace all {{...}} values"
else
  pass "No unfilled placeholders"
fi

# --- Check 9: Referenced directories exist ---
echo ""
echo "--- Directory Existence ---"

DIRS=$(grep '^|' "${STRUCTURE_MAP}" \
  | grep -oE '`[^`]+/`' \
  | tr -d '`' \
  | grep -v '<' \
  | sort -u || true)

if [[ -z "${DIRS}" ]]; then
  info "No concrete directory paths found in table to verify"
else
  while IFS= read -r dir; do
    FULL_PATH="${PROJECT_ROOT}/${dir}"
    if [[ -d "${FULL_PATH}" ]]; then
      pass "Directory exists: ${dir}"
    else
      info "Directory not yet created: ${dir} (will be created on first use)"
    fi
  done <<< "${DIRS}"
fi

# --- Summary ---
echo ""
if [[ "${EXIT_CODE}" -eq 0 ]]; then
  echo "Result: PASS ✅"
else
  echo "Result: FAIL ❌ (fix the issues above)"
fi

exit "${EXIT_CODE}"
