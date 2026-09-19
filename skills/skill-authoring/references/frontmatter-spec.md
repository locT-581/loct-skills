# Frontmatter Specification

Human-readable reference for every SKILL.md frontmatter field.

> [!IMPORTANT]
> The JSON Schema files in `schema/` are the canonical source of truth for validation rules (character limits, regex patterns, allowed values). This document describes those rules in prose. If this document and the schema disagree, **the schema wins**.

---

## Registry Skill Frontmatter

```yaml
---
name: "kebab-case-name"
version: "1.0.0"
description: "What this skill does and when it activates."
triggers:
  globs:
    - "src/**/*.ts"
  intents:
    - "create new component"
  default_mode: "auto"
dependencies:
  - "other-skill-name"
---
```

### `name` (required)

- Format: `kebab-case` — lowercase letters, digits, and hyphens only
- Pattern: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`
- Must be unique across the entire repository
- **Must match the directory name exactly** — `skills/my-skill/` → `name: "my-skill"`

### `version` (required for Registry)

- Format: Semantic Versioning `MAJOR.MINOR.PATCH`
- Pattern: `^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$` (no leading zeros)
- Start at `1.0.0` for new skills
- Bump rules:
  - **MAJOR** — breaking changes (rules removed, behavior reversed)
  - **MINOR** — new rules added, non-breaking scope expansion
  - **PATCH** — typo fixes, clarifications, example updates

### `description` (required)

- Length: 10–200 characters (enforced by schema)
- Must answer two questions: **"What does this skill do?"** and **"When should it activate?"**
- This is the **primary input for agent semantic routing** — precision matters more than brevity

| Quality | Example |
|---|---|
| ❌ Vague | "A useful skill for developers" |
| ❌ Too long | "This skill provides comprehensive guidelines for..." |
| ✅ Precise | "Strict TypeScript standards (Strict Typing, No Any, Exhaustive Checking, Zod Validation)" |
| ✅ Precise | "Clean Architecture guidelines for Next.js App Router (Server Components, Actions, Repository Pattern)" |

### `triggers.globs` (Registry only)

- Standard glob syntax: `src/**/*.ts`, `*.config.{js,ts}`
- Be specific — overly broad globs (e.g., `**/*`) cause unnecessary activation and waste context
- Use empty array `[]` for intent-only activation (recommended for meta-skills)

### `triggers.intents` (Registry only)

- Natural language phrases users would say to invoke this skill
- **Use 2–5 intents** when intent routing is used — enough to cover common phrasings, not so many that routing becomes noisy (schema enforces max 5)
- May include non-English phrases if the repository's `document_output_language` config is set (this is a repo-level setting, e.g. in `_bmad/config.toml`, not a frontmatter field)
- Each intent should be a complete phrase, not a single word

### `triggers.default_mode` (Registry only)

| Mode | Behavior | When to use |
|---|---|---|
| `"auto"` | Activates when globs or intents match | Default for most skills |
| `"always"` | Always active in every context | Only for foundational rules (e.g., TypeScript strict) |
| `"manual"` | Only activates when explicitly requested | For rarely-used or dangerous skills |

### `dependencies` (Registry only)

- Flat list of other skill names this skill requires
- The CLI will prompt to install dependencies automatically
- Keep dependencies minimal — each one is a hard requirement

**Version constraints (forward-compatible):**

The current CLI resolves dependencies by name only. However, when authoring skills, document expected compatibility in the body:

```markdown
> [!IMPORTANT]
> This skill requires `typescript-strict-rules` v2.0.0 or later.
> Features added in v2.0.0 (exhaustive checking) are referenced in rules 3 and 5.
```

Future CLI versions may support version ranges:
```yaml
dependencies:
  - name: "typescript-strict-rules"
    version: ">=2.0.0"
```

Author skills with this forward-compatibility in mind.

---

## Workspace Skill Frontmatter

Workspace skills use minimal frontmatter:

```yaml
---
name: skill-name
description: 'What this skill does. Use when the user says "trigger phrase".'
---
```

### `name` (required)

Same rules as Registry: `kebab-case`, matches directory name.

### `description` (required)

Same precision requirements as Registry, plus:
- **Include trigger phrases** in the description — this is how the agent decides to load the skill
- Format: `'<what it does>. Use when <trigger condition>.'`

Examples:
- ✅ `'Facilitate a brainstorming session. Use when the user says "help me brainstorm" or "help me ideate"'`
- ✅ `'Run code review with multiple reviewers. Use when the user says "review this code"'`
- ❌ `'A brainstorming tool'` — no trigger condition
