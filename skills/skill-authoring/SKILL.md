---
name: "skill-authoring"
version: "2.1.0"
description: "Guides AI agents through creating, validating, and maintaining skills that conform to the repository's Canonical Schema. Covers both Registry Skills (skills/) and Workspace Skills (.agent/skills/)."
triggers:
  globs: []
  intents:
    - "create new skill"
    - "author a skill"
    - "validate skill structure"
    - "review skill quality"
    - "tạo skill mới"
  default_mode: "auto"
dependencies: []
---

# Skill Authoring

This meta-skill guides AI agents through producing skills that are consistent, high-quality, and immediately usable within the Canonical Schema.

## 1. Scope

A **skill** is a self-contained package of knowledge, rules, and optional resources (templates, scripts, references) that teaches an AI agent how to perform a specific task or enforce a specific standard.

**Create a new skill** when a recurring pattern, workflow, or standard needs to be codified and reused. **Do not create a skill** when a one-line rule in `AGENTS.md` suffices, the knowledge is purely project-local, or an existing skill already covers the topic — extend it instead.

## 2. Path Model

Three namespaces exist — confusing them causes files in wrong locations.

| Namespace | Location | Purpose |
|---|---|---|
| **Upstream source** | `skills/<name>/` | Canonical source in this registry repository. You author here. |
| **Downstream install** | `.skills/<name>/` | Copy installed into a target project via `skills add`. Read-only for consumers. |
| **Workspace skill** | `.agent/skills/<name>/` | Agent-discovered workflow skills. Not distributed via CLI. |

When writing TIP/IMPORTANT callouts that reference templates or scripts, use the path the **consumer** will see:
- Registry Skill callouts → `.skills/<name>/templates/` (downstream installed path)
- Workspace Skill callouts → relative paths from skill root

## 3. Skill Types

Choose the type based on the **distribution boundary** — this is the primary classifier.

| | Registry Skill | Workspace Skill |
|---|---|---|
| **Distribution** | Across projects via CLI | Single workspace only |
| **Source path** | `skills/<name>/` | `.agent/skills/<name>/` |
| **Frontmatter** | Rich (name, version, description, triggers, dependencies) | Minimal (name, description) |
| **Primary content** | Rules, principles, code examples | Workflow SOP with step-by-step instructions |
| **Template** | `templates/SKILL.md.template` | `templates/SKILL-workspace.md.template` |

> [!TIP]
> Secondary heuristic: *what code should look like* → Registry; *how to accomplish a task* → Workspace. But distribution intent always takes precedence — a hybrid skill that enforces rules AND runs procedures is Registry if it's meant for multiple projects.

## 4. SOP — 7 Steps

### Step 1: Gather Requirements

Clarify: (1) what problem, (2) who uses it, (3) activation context, (4) Registry or Workspace, (5) dependencies.

Infer non-critical defaults when confidence is high (name, version, default triggers, no-dependency). Ask only when an unresolved requirement would materially change the skill's type, behavior, output, or compatibility. Document all inferred defaults before implementation so the user can override.

### Step 2: Name & Classify

- **Name:** `kebab-case`, lowercase, descriptive. Must match directory name.
  - ✅ `nextjs-clean-architecture`, `api-error-handling`
  - ❌ `mySkill`, `NewSkill_v2`, `rules`
- **Path:** Registry → `skills/<name>/` · Workspace → `.agent/skills/<name>/`

### Step 3: Write SKILL.md

Use the appropriate template from this skill's `templates/` directory. Refer to `references/frontmatter-spec.md` for field specifications and `references/writing-guide.md` for body markdown standards.

### Step 4: Create Templates (if needed)

Boilerplate code for downstream scaffolding. Place in `<skill-dir>/templates/`. Use `{{placeholder}}` syntax (PascalCase for types, camelCase for values). Each template must be a complete, valid file when placeholders are filled. Comment each placeholder. Only create when the skill involves generating repetitive code structures.

### Step 5: Create Scripts (if needed)

Read-only verification scripts. Place in `<skill-dir>/scripts/`. Use `templates/verify.sh.template` as the starting point — it performs conservative static checks for common unsafe patterns (`set -euo pipefail`, no eval, no network, no mutation). This is not a substitute for manual review. Only create when the skill has mechanically verifiable rules.

### Step 6: Create References (if needed)

Supplementary documentation the agent loads on demand. Place in `<skill-dir>/references/`. One topic per file. Only create when SKILL.md would exceed ~200 lines without them.

### Step 7: Validate

Run through every item in `references/quality-checklist.md`. All **Critical** items must pass. Any skipped **Recommended** items must include rationale.

Run `bash scripts/verify.sh <skill-directory>` to validate frontmatter against the appropriate schema (`schema/registry-skill.schema.json` or `schema/workspace-skill.schema.json`) and check structural + safety rules.

## 5. Output Contract

Every skill delivery MUST contain:

1. **Classification** — Registry or Workspace, with rationale if non-obvious
2. **Skill directory** — complete, at the correct path per the Path Model
3. **SKILL.md** — frontmatter + body conforming to Canonical Schema
4. **Validation report** — all Critical checklist items passed; any skipped Recommended items documented with rationale
5. **Optional resources** — `templates/`, `scripts/`, `references/` as applicable

The agent MUST present the validation report before declaring delivery complete. Two agents using this skill should produce the same required artifact classes and satisfy the same validation contract for equivalent inputs.

## 6. Directory Structure

```text
<skill-dir>/
├── SKILL.md              # REQUIRED
├── templates/            # OPTIONAL — boilerplate code
├── scripts/              # OPTIONAL — read-only verification
└── references/           # OPTIONAL — supplementary docs
```

> [!TIP]
> Templates for each file type are in this skill's `templates/` directory.
> Detailed field specs: `references/frontmatter-spec.md`
> Writing standards: `references/writing-guide.md`
> Common mistakes: `references/anti-patterns.md`
> Annotated examples: `references/examples.md`

> [!IMPORTANT]
> After creating a skill, validate against: `references/quality-checklist.md`
> Machine-readable schemas: `schema/registry-skill.schema.json`, `schema/workspace-skill.schema.json`
> Run validator: `bash scripts/verify.sh <skill-directory>`
