"""
Skill Authoring — Canonical Skill Validator

Validates a skill directory against the Canonical Schema using proper YAML
parsing and JSON Schema validation.

Prerequisites (install once, before first run):
    pip install pyyaml jsonschema
    # or: uv pip install pyyaml jsonschema

Usage:
    python3 tools/validate.py <skill-directory>
    python3 tools/validate.py --type registry <skill-directory>
    python3 tools/validate.py --type workspace <skill-directory>

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
    print("❌ Missing dependency: pyyaml")
    print("   Install once: pip install pyyaml jsonschema")
    sys.exit(2)

try:
    import jsonschema
except ImportError:
    print("❌ Missing dependency: jsonschema")
    print("   Install once: pip install pyyaml jsonschema")
    sys.exit(2)


# ─── Strict YAML loader (rejects duplicate keys) ─────────────────────

class DuplicateKeyError(Exception):
    """Raised when a YAML mapping contains duplicate keys."""
    def __init__(self, key: str) -> None:
        self.key = key
        super().__init__(f"duplicate YAML key: {key}")


class _StrictSafeLoader(yaml.SafeLoader):
    """SafeLoader that raises DuplicateKeyError on duplicate mapping keys."""
    pass


def _strict_construct_mapping(loader: yaml.Loader, node: yaml.MappingNode, deep: bool = False) -> dict:
    loader.flatten_mapping(node)
    pairs = loader.construct_pairs(node, deep=deep)
    seen: set[str] = set()
    for key, _ in pairs:
        key_str = str(key)
        if key_str in seen:
            raise DuplicateKeyError(key_str)
        seen.add(key_str)
    return dict(pairs)


_StrictSafeLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _strict_construct_mapping,
)


# ─── Constants ────────────────────────────────────────────────────────

SKILL_MD = "SKILL.md"
MAX_LINES_PASS = 200
MAX_LINES_WARN = 250

# Dangerous patterns in script UNCOMMENTED lines (heuristics, not guarantees).
# Patterns are checked against uncommented lines only (comment lines stripped).
# For command-name patterns, \b ensures we match the command itself, not
# occurrences inside strings like grep "curl". This reduces false positives
# but cannot eliminate them — the safety claim is "heuristic, not a substitute
# for manual review".

MUTATION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\brm\s"),
    re.compile(r"\bmv\s"),
    re.compile(r"\bcp\s"),
    re.compile(r"\btouch\s"),
    re.compile(r"\bmkdir\s"),
    re.compile(r"\btee\s"),
    re.compile(r"\btruncate\s"),
    re.compile(r"\bsed\s+-i"),
    re.compile(r"\bchmod\s"),
    re.compile(r"\bchown\s"),
    re.compile(r"\bln\s"),
    re.compile(r"\binstall\s+-"),  # install -m/-d/-g/-o (not "pip install" in echo)
    # > file / 1> file / 2> file (not >/dev/null, not > "$var" which is below)
    re.compile(r"(?:^|\s)[12]?\s*>\s*(?!/dev/null)[a-zA-Z./]"),
    # >> file (not >>/dev/null)
    re.compile(r"\s>>\s*(?!/dev/null)\S"),
    # > "$var" / > "${var}" — quoted variable redirect
    re.compile(r'(?:^|\s)[12]?\s*>\s*["\$]'),
    # >> "$var" — append to quoted variable
    re.compile(r'\s>>\s*["\$]'),
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
    re.compile(r"\bgit\s+clone\b"),
    re.compile(r"\bgit\s+fetch\b"),
    re.compile(r"\bgit\s+pull\b"),
    re.compile(r"\bgit\s+ls-remote\b"),
    re.compile(r"\bnc\b"),
    re.compile(r"\bncat\b"),
    re.compile(r"\bssh\b"),
    re.compile(r"\bscp\b"),
]
# Patterns that indicate a script executes external code (trust boundary).
# Verifier scripts must be self-contained Bash — they should not delegate
# to unscanned Python/JS/shell scripts.
# Excludes: python3 -c "..." (inline, safe), command -v python3 (check, safe)
EXEC_EXTERNAL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bpython3?\s+(?!-c\b)\S"),  # python3 <script> (not python3 -c)
    re.compile(r"\bnode\s+(?!-e\b)\S"),       # node <script> (not node -e)
    re.compile(r"\bbash\s+(?!-c\b)\S"),       # bash <script> (not bash -c)
    re.compile(r"\bsh\s+(?!-c\b)\S"),         # sh <script> (not sh -c)
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
            print(f"✨ All automated checks passed with {self.warnings} warning(s)")
            return 0
        else:
            print("✨ All automated checks passed!")
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


def detect_skill_type(skill_path_str: str, explicit_type: str | None = None) -> str | None:
    """Detect whether this is a registry or workspace skill.

    Detection priority:
    1. Explicit --type flag (highest)
    2. Canonical path patterns (immediate parent check):
       - .agent/skills/<name>  → workspace
       - skills/<name>         → registry
       - .skills/<name>        → registry
    3. None if ambiguous (caller must handle)
    """
    if explicit_type:
        if explicit_type in ("registry", "workspace"):
            return explicit_type
        return None

    resolved = Path(skill_path_str).resolve()
    parent_name = resolved.parent.name
    grandparent_name = resolved.parent.parent.name if resolved.parent != resolved.parent.parent else ""

    # .agent/skills/<name>
    if parent_name == "skills" and grandparent_name == ".agent":
        return "workspace"

    # skills/<name> or .skills/<name>
    if parent_name in ("skills", ".skills"):
        return "registry"

    return None


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
        data = yaml.load(yaml_str, Loader=_StrictSafeLoader)
    except DuplicateKeyError as e:
        r.failed(f"duplicate YAML key: '{e.key}' — each key must appear exactly once")
        return None, yaml_str
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
    """Check 6: Registry skills must have at least one activation path (unless manual/always)."""
    if skill_type != "registry":
        return

    r.check("Skill has at least one activation path (globs or intents)")
    triggers = frontmatter.get("triggers", {})
    globs = triggers.get("globs", [])
    intents = triggers.get("intents", [])
    mode = triggers.get("default_mode", "auto")

    if mode == "manual":
        r.passed("manual mode — activated only on explicit request")
    elif mode == "always":
        r.passed("always mode — activated in every context")
    elif globs or intents:
        r.passed(f"{len(globs)} glob(s), {len(intents)} intent(s)")
    else:
        r.failed("both globs and intents are empty with mode 'auto' — skill can never activate")


def check_templates(r: Results, skill_dir: Path) -> None:
    """Check 7: Templates with placeholders contain documentation comments."""
    templates_dir = skill_dir / "templates"
    r.check("Templates with placeholders contain documentation comments")

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

    Performs conservative static checks for common unsafe patterns in Bash
    scripts. Only *.sh files are canonical verifiers — non-Bash executables
    in scripts/ are flagged.

    This is NOT a substitute for manual review.
    """
    scripts_dir = skill_dir / "scripts"
    r.check("Scripts follow safety rules (heuristic — not a substitute for review)")
    errors_before = r.errors

    if not scripts_dir.is_dir():
        r.skipped("no scripts/ directory")
        return

    # Reject non-.sh files in scripts/ (canonical standard: bash verifiers only)
    # Tooling like Python validators belongs in tools/, not scripts/
    non_bash = [
        f.name for f in sorted(scripts_dir.iterdir())
        if f.is_file() and f.suffix not in (".sh", ".md", "")
    ]
    for nb in non_bash:
        r.failed(f"{nb}: scripts/ may only contain Bash verifiers (*.sh) — move tooling to tools/")

    bash_scripts = sorted(scripts_dir.glob("*.sh"))
    if not bash_scripts and not non_bash:
        r.skipped("no scripts found")
        return

    for script in bash_scripts:
        name = script.name
        text = script.read_text(errors="replace")
        lines = text.splitlines()

        # Check for set -euo pipefail (exact, not just set -e)
        # Only check non-comment lines in first 20 lines
        header_lines = [
            line for line in lines[:20]
            if line.strip() and not line.lstrip().startswith("#")
        ]
        header_code = "\n".join(header_lines)
        if "set -euo pipefail" not in header_code:
            if "set -e" in header_code:
                r.failed(f"{name}: has 'set -e' but must use 'set -euo pipefail'")
            else:
                r.failed(f"{name}: missing 'set -euo pipefail' in first 20 lines")

        # Get uncommented lines for pattern checks
        uncommented = [
            line for line in lines
            if line.strip() and not line.lstrip().startswith("#")
        ]
        uncommented_text = "\n".join(uncommented)

        # Injection patterns → error
        for pattern in INJECTION_PATTERNS:
            if pattern.search(uncommented_text):
                r.failed(f"{name}: contains '{pattern.pattern}' — code injection risk")

        # Network patterns → error
        for pattern in NETWORK_PATTERNS:
            if pattern.search(uncommented_text):
                r.failed(f"{name}: contains '{pattern.pattern}' — scripts must be offline")

        # Mutation patterns → error (clear primitives are not ambiguous)
        for pattern in MUTATION_PATTERNS:
            if pattern.search(uncommented_text):
                r.failed(f"{name}: mutation detected ('{pattern.pattern}') — scripts must be read-only")
                break  # One mutation error per script is enough

        # External execution → warning (trust boundary)
        # Verifier scripts should not delegate to unscanned external code.
        # This is a warning because the static checker cannot determine if
        # the target code is safe — flag for human review.
        for pattern in EXEC_EXTERNAL_PATTERNS:
            if pattern.search(uncommented_text):
                r.warned(f"{name}: invokes external code ('{pattern.pattern}') — verify target is safe and read-only")
                break

    # Only report pass if no errors were added by this check
    errors_after = r.errors
    if errors_after == errors_before:
        r.passed()


def check_referenced_paths(r: Results, skill_dir: Path, content: str) -> None:
    """Check 9: Paths referenced in SKILL.md actually exist."""
    r.check("Referenced local paths exist")

    # Find references to local skill subdirectories in the content
    # Covers: templates/, scripts/, references/, schema/, tests/, tools/
    path_pattern = re.compile(
        r"(?:templates|scripts|references|schema|tests|tools)/[\w./-]+"
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
    # Parse args: [--type registry|workspace] <skill-directory>
    args = sys.argv[1:]
    explicit_type: str | None = None

    if "--type" in args:
        idx = args.index("--type")
        if idx + 1 >= len(args):
            print("❌ --type requires a value: registry or workspace")
            return 2
        explicit_type = args[idx + 1]
        args = args[:idx] + args[idx + 2:]

    if len(args) != 1:
        print(f"Usage: {sys.argv[0]} [--type registry|workspace] <skill-directory>")
        return 2

    skill_path_str = args[0]
    skill_dir = Path(skill_path_str)

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
    print(f"🔍 Validating skill directory: {skill_path_str}")
    print()

    # Check 1-2: Frontmatter parse
    frontmatter, _ = check_frontmatter_parse(r, content)
    if frontmatter is None:
        print()
        print("💥 Cannot continue without valid frontmatter")
        return 1

    # Detect skill type (path-based, not content-based)
    skill_type = detect_skill_type(skill_path_str, explicit_type)
    if skill_type is None:
        print()
        print(f"❌ Cannot determine skill type from path: {skill_path_str}")
        print("   Use --type registry or --type workspace")
        return 2

    # Check 3: Schema validation (required — missing schema is a hard failure)
    schema = load_schema(schema_dir, skill_type)
    if schema:
        check_schema_validation(r, frontmatter, schema, skill_type)
    else:
        r.check(f"Schema validation ({skill_type})")
        r.failed(f"canonical schema not found: {schema_dir}/{skill_type}-skill.schema.json")

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
