# Quality Checklist for Skills

Run through this checklist after creating a skill. Fix all **Critical** items before delivery. Document any skipped **Recommended** items with rationale in the validation report.

---

## Critical (Must Pass)

### Frontmatter

- [ ] `name` is kebab-case and matches the directory name exactly
- [ ] `name` is unique across the repository (no duplicates in `skills/` or `.agent/skills/`)
- [ ] `description` is 1-2 sentences, precise, and answers "what + when"
- [ ] `description` does NOT use vague words like "useful", "helpful", "general"
- [ ] `version` follows semver format `X.Y.Z` (Registry Skills only)
- [ ] `triggers.globs` are specific — no `**/*` or overly broad patterns (Registry Skills only)
- [ ] `triggers.intents` include 2-5 natural language phrases (Registry Skills only)
- [ ] `dependencies` list is accurate — every listed skill exists in the repository
- [ ] Frontmatter validates against `schema/registry-skill.schema.json` or `schema/workspace-skill.schema.json`

### Body Content

- [ ] SKILL.md has at least one section of actionable rules or SOP steps
- [ ] Rules are imperative ("Do X") not passive ("X should be considered")
- [ ] No contradictions between rules within the skill
- [ ] At least one code example demonstrating correct usage (for rules-based skills)
- [ ] All file paths referenced in the skill are correct and the files exist

### Path Model

- [ ] Callout paths use the correct namespace (`.skills/` for downstream, `skills/` for authoring)
- [ ] No confusion between `skills/`, `.skills/`, and `.agent/skills/`
- [ ] If both upstream and downstream paths are mentioned, the distinction is explained

### Structure

- [ ] SKILL.md file exists in the skill directory
- [ ] Directory name matches `name` in frontmatter
- [ ] Templates use `{{placeholder}}` syntax with clear naming (if templates exist)
- [ ] Scripts use `set -euo pipefail` as baseline (if scripts exist)
- [ ] Scripts are read-only — no file mutations, no network, no eval (if scripts exist)

---

## Recommended (Should Pass)

### Quality

- [ ] Description is optimized for semantic search / agent routing
- [ ] Code examples include both ✅ correct and ❌ incorrect patterns
- [ ] Templates produce valid, runnable code when all placeholders are filled
- [ ] SKILL.md length is under 200 lines (extract overflow to `references/`)
- [ ] Each template has comments explaining each `{{placeholder}}`
- [ ] Verify script covers the most important rules in the skill
- [ ] References are focused — one topic per file

### Consistency

- [ ] Writing style matches existing skills in the repository
- [ ] Section headings follow the established numbering pattern
- [ ] `> [!TIP]` callouts point to template locations
- [ ] `> [!IMPORTANT]` callouts point to verification commands
- [ ] No raw URLs without markdown link formatting

### Output Contract Compliance

- [ ] Delivery includes classification (Registry/Workspace) with rationale
- [ ] Delivery includes complete skill directory at correct path
- [ ] Delivery includes SKILL.md conforming to Canonical Schema
- [ ] Delivery includes this validation report with all Critical items checked
- [ ] Any skipped Recommended items have documented rationale

### Completeness

- [ ] Skill covers edge cases and boundary conditions in its rules
- [ ] Anti-patterns or "what NOT to do" are documented (see `references/anti-patterns.md`)
- [ ] If the skill has dependencies, the relationship is explained in the body
- [ ] If version compatibility matters, it's noted (even if CLI doesn't enforce yet)
