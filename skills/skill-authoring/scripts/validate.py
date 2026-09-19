# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pyyaml>=6.0",
#     "jsonschema>=4.20",
# ]
# ///
"""
Skill Authoring — Canonical Skill Validator

Validates a skill directory against the Canonical Schema using proper YAML
parsing and JSON Schema validation. This replaces grep-based checks.

Usage:
    uv run scripts/validate.py <skill-directory>
    python3 scripts/validate.py <skill-directory>  # if deps are installed

SAFETY: This script is strictly read-only. No mutations, no network.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("❌ pyyaml not installed. Run with: uv run scripts/validate.py <dir>")
    sys.exit(2)

try:
    import jsonschema
except ImportError:
    print("❌ jsonschema not installed. Run with: uv run scripts/validate.py <dir>")
    sys.exit(2)


# ─── Constants ────────────────────────────────────────────────────────

SKILL_MD = "SKILL.md"
MAX_LINES_PASS = 200
MAX_LINES_WARN = 250

# Dangerous patterns in script UNCOMMENTED lines (heuristics, not guarantees)
MUTATION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\brm\s"),
    re.compile(r"\bmv\s"),
    re.compile(r"\bcp\s+-[rf]"),
    re.compile(r"\btouch\s"),
    re.compile(r"\bmkdir\s"),
    re.compile(r"\btee\s"),
    re.compile(r"\btruncate\s"),
    re.compile(r"\bsed\s+-i"),
    re.compile(r"(?:^|\s)[12]?\s*>\s*[a-zA-Z./]"),  # > file or 1> file (not inside strings/html)
    re.compile(r"\s>>\s*\S"),                   # >> file (redirect append)
]
INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\beval\b"),
    re.compile(r"\bsource\s"),
    re.compile(r"^\.\s+/", re.MULTILINE),       # . /path (source shorthand, must start line)
]
NETWORK_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bcurl\b"),
    re.compile(r"\bwget\b"),
    re.compile(r"\bfetch\b"),
]


# ─── Result tracking ─────────────────────────────────────────────────

class Results:
    def __init__(self) -> None:
        self.errors = 0
        self.warnings = 0
        self._check_num = 0

    def check(self, label: str) -> None:
        self._check_num += 1
        self._current = f"Check {self._check_num}: {label}"
        print(self._current)

    def passed(self, detail: str = "") -> None:
        msg = "  ✅ Pass"
        if detail:
            msg += f" — {detail}"
        print(msg)

    def failed(self, reason: str) -> None:
        print(f"  ❌ Fail: {reason}")
        self.errors += 1

    def warned(self, reason: str) -> None:
        print(f"  ⚠️  Warning: {reason}")
        self.warnings += 1

    def skipped(self, reason: str) -> None:
        print(f"  ⏭️  Skipped — {reason}")

    def summary(self) -> int:
        print()
        print("━" * 46)
        if self.errors > 0:
            print(f"💥 {self.errors} error(s), {self.warnings} warning(s)")
            return 1
        elif self.warnings > 0:
            print(f"✨ All checks passed with {self.warnings} warning(s)")
            return 0
        else:
            print("✨ All checks passed!")
            return 0


# ─── Frontmatter extraction ──────────────────────────────────────────

def extract_frontmatter(content: str) -> tuple[str | None, str | None]:
    """Extract YAML frontmatter between --- markers.

    Returns (yaml_str, error_message). On success error is None.
    """
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        return None, "file does not start with '---'"

    end_idx = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        return None, "no closing '---' found — frontmatter is not properly terminated"

    yaml_str = "\n".join(lines[1:end_idx])
    if not yaml_str.strip():
        return None, "frontmatter block is empty"

    return yaml_str, None


# ─── Schema loading ──────────────────────────────────────────────────

def load_schema(schema_dir: Path, skill_type: str) -> dict | None:
    """Load the appropriate JSON Schema for the skill type."""
    filename = f"{skill_type}-skill.schema.json"
    schema_path = schema_dir / filename
    if not schema_path.exists():
        return None
    with open(schema_path) as f:
        return json.load(f)


def detect_skill_type(frontmatter: dict, skill_dir: Path) -> str:
    """Detect whether this is a registry or workspace skill."""
    # If path contains .agent/skills, it's workspace
    parts = skill_dir.resolve().parts
    if ".agent" in parts or "_agent" in parts:
        return "workspace"
    # If frontmatter has version field, it's registry
    if "version" in frontmatter:
        return "registry"
    # Default to workspace if no version
    return "workspace"


# ─── Checks ──────────────────────────────────────────────────────────

def check_frontmatter_parse(r: Results, content: str) -> tuple[dict | None, str | None]:
    """Check 1-2: Frontmatter exists and parses as valid YAML."""
    r.check("Frontmatter exists and is properly delimited")
    yaml_str, err = extract_frontmatter(content)
    if err:
        r.failed(err)
        return None, None

    r.passed()

    r.check("Frontmatter is valid YAML")
    try:
        data = yaml.safe_load(yaml_str)
    except yaml.YAMLError as e:
        r.failed(f"YAML parse error: {e}")
        return None, yaml_str

    if not isinstance(data, dict):
        r.failed(f"frontmatter must be a mapping, got {type(data).__name__}")
        return None, yaml_str

    r.passed()
    return data, yaml_str


def check_schema_validation(
    r: Results, frontmatter: dict, schema: dict, skill_type: str
) -> None:
    """Check 3: Validate frontmatter against JSON Schema."""
    r.check(f"Frontmatter validates against {skill_type}-skill.schema.json")
    validator = jsonschema.Draft202012Validator(schema)
    schema_errors = sorted(validator.iter_errors(frontmatter), key=lambda e: list(e.path))

    if not schema_errors:
        r.passed()
    else:
        for err in schema_errors:
            path = ".".join(str(p) for p in err.absolute_path) or "(root)"
            r.failed(f"[{path}] {err.message}")


def check_name_matches_dir(r: Results, frontmatter: dict, skill_dir: Path) -> None:
    """Check 4: name field matches directory name."""
    r.check("'name' matches directory name")
    name = frontmatter.get("name", "")
    dir_name = skill_dir.name
    if name == dir_name:
        r.passed()
    else:
        r.failed(f"name '{name}' does not match directory '{dir_name}'")


def check_line_count(r: Results, content: str) -> None:
    """Check 5: SKILL.md line count."""
    r.check("SKILL.md line count")
    count = content.count("\n") + (0 if content.endswith("\n") else 1)
    if count <= MAX_LINES_PASS:
        r.passed(f"{count} lines")
    elif count <= MAX_LINES_WARN:
        r.warned(f"{count} lines (target <{MAX_LINES_PASS}, consider extracting to references/)")
    else:
        r.failed(f"{count} lines (exceeds {MAX_LINES_PASS} — extract supplementary content to references/)")


def check_activation_coverage(r: Results, frontmatter: dict, skill_type: str) -> None:
    """Check 6: Registry skills should have at least one activation path."""
    if skill_type != "registry":
        return

    r.check("Skill has at least one activation path (globs or intents)")
    triggers = frontmatter.get("triggers", {})
    globs = triggers.get("globs", [])
    intents = triggers.get("intents", [])
    mode = triggers.get("default_mode", "auto")

    if mode == "manual":
        r.passed("manual mode — activated only on explicit request")
    elif globs or intents:
        r.passed(f"{len(globs)} glob(s), {len(intents)} intent(s)")
    else:
        r.warned("both globs and intents are empty with mode 'auto' — skill may never activate")


def check_templates(r: Results, skill_dir: Path) -> None:
    """Check 7: Templates have documented placeholders."""
    templates_dir = skill_dir / "templates"
    r.check("Template placeholders are documented")

    if not templates_dir.is_dir():
        r.skipped("no templates/ directory")
        return

    issues = 0
    for tpl in sorted(templates_dir.iterdir()):
        if not tpl.is_file():
            continue
        text = tpl.read_text(errors="replace")
        if "{{" not in text:
            continue
        # Check for any comment lines
        has_comments = any(
            line.lstrip().startswith(("//", "#", "<!--"))
            for line in text.splitlines()
        )
        if not has_comments:
            r.warned(f"{tpl.name} has placeholders but no comments")
            issues += 1

    if issues == 0:
        r.passed()


def check_scripts_safety(r: Results, skill_dir: Path) -> None:
    """Check 8: Scripts follow safety rules.

    Performs conservative static checks for common unsafe patterns.
    This is NOT a substitute for manual review — it catches obvious
    violations but cannot guarantee a script is safe.
    """
    scripts_dir = skill_dir / "scripts"
    r.check("Scripts follow safety rules (heuristic — not a substitute for review)")

    if not scripts_dir.is_dir():
        r.skipped("no scripts/ directory")
        return

    issues = 0
    for script in sorted(scripts_dir.glob("*.sh")):
        name = script.name
        text = script.read_text(errors="replace")
        lines = text.splitlines()

        # Check for set -euo pipefail (exact, not just set -e)
        header = "\n".join(lines[:20])
        if "set -euo pipefail" not in header:
            if "set -e" in header:
                r.failed(f"{name}: has 'set -e' but must use 'set -euo pipefail'")
            else:
                r.failed(f"{name}: missing 'set -euo pipefail' in first 20 lines")

        # Get uncommented lines for pattern checks
        uncommented = [
            line for line in lines
            if line.strip() and not line.lstrip().startswith("#")
        ]
        uncommented_text = "\n".join(uncommented)

        # Check for dangerous patterns
        for pattern in INJECTION_PATTERNS:
            if pattern.search(uncommented_text):
                r.failed(f"{name}: contains '{pattern.pattern}' — code injection risk")

        for pattern in NETWORK_PATTERNS:
            if pattern.search(uncommented_text):
                r.failed(f"{name}: contains '{pattern.pattern}' — scripts must be offline")

        for pattern in MUTATION_PATTERNS:
            if pattern.search(uncommented_text):
                r.warned(f"{name}: possible mutation detected ('{pattern.pattern}') — verify read-only intent")
                issues += 1
                break  # One mutation warning per script is enough

    if issues == 0 and r.errors == 0:
        r.passed()


def check_referenced_paths(r: Results, skill_dir: Path, content: str) -> None:
    """Check 9: Paths referenced in SKILL.md actually exist."""
    r.check("Referenced local paths exist")

    # Find references to templates/, scripts/, references/ in the skill content
    # Pattern: backtick-wrapped or bare paths like templates/foo, references/bar.md
    path_pattern = re.compile(
        r"(?:templates|scripts|references)/[\w./-]+"
    )
    matches = path_pattern.findall(content)
    if not matches:
        r.skipped("no local path references detected")
        return

    missing = []
    for ref_path in set(matches):
        full = skill_dir / ref_path
        if not full.exists():
            missing.append(ref_path)

    if missing:
        for m in missing:
            r.failed(f"referenced path does not exist: {m}")
    else:
        r.passed(f"{len(set(matches))} path(s) verified")


# ─── Main ─────────────────────────────────────────────────────────────

def main() -> int:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <skill-directory>")
        return 2

    skill_dir = Path(sys.argv[1])

    # Resolve and verify
    skill_dir_resolved = skill_dir.resolve()
    if not skill_dir_resolved.is_dir():
        print(f"❌ Not a directory: {skill_dir}")
        return 2

    skill_md = skill_dir_resolved / SKILL_MD
    if not skill_md.exists():
        print(f"❌ {SKILL_MD} not found in {skill_dir}")
        return 1

    content = skill_md.read_text(encoding="utf-8")

    # Locate schemas relative to this script
    script_dir = Path(__file__).resolve().parent
    schema_dir = script_dir.parent / "schema"

    r = Results()
    print(f"🔍 Validating skill directory: {sys.argv[1]}")
    print()

    # Check 1-2: Frontmatter parse
    frontmatter, _ = check_frontmatter_parse(r, content)
    if frontmatter is None:
        print()
        print("💥 Cannot continue without valid frontmatter")
        return 1

    # Detect skill type
    skill_type = detect_skill_type(frontmatter, Path(sys.argv[1]))

    # Check 3: Schema validation
    schema = load_schema(schema_dir, skill_type)
    if schema:
        check_schema_validation(r, frontmatter, schema, skill_type)
    else:
        r.check(f"Schema validation ({skill_type})")
        r.skipped(f"schema file not found at {schema_dir}")

    # Check 4: Name matches directory
    check_name_matches_dir(r, frontmatter, skill_dir_resolved)

    # Check 5: Line count
    check_line_count(r, content)

    # Check 6: Activation coverage (registry only)
    check_activation_coverage(r, frontmatter, skill_type)

    # Check 7: Template placeholders
    check_templates(r, skill_dir_resolved)

    # Check 8: Script safety
    check_scripts_safety(r, skill_dir_resolved)

    # Check 9: Referenced paths
    check_referenced_paths(r, skill_dir_resolved, content)

    return r.summary()


if __name__ == "__main__":
    sys.exit(main())
