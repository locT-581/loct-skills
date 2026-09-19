# Body Markdown Writing Guide

Standards for writing the body content of SKILL.md files.

---

## Writing Style

1. **Be imperative, not descriptive.** Write "Use `unknown` instead of `any`" not "It is recommended to avoid `any`".
2. **One rule = one bullet.** Don't combine multiple rules into a single paragraph.
3. **Include rationale sparingly.** Only explain *why* when the rule is counter-intuitive.
4. **Code examples > prose.** A 5-line code block teaches more than a paragraph of explanation.
5. **Use callouts strategically** — don't stack them consecutively:
   - `> [!TIP]` — template/script locations, helpful shortcuts
   - `> [!IMPORTANT]` — verification commands, critical constraints
   - `> [!CAUTION]` — common pitfalls that cause breakage

---

## Registry Skill Structure

Registry Skills define **what** standards to enforce. Organize the body as:

### 1. Core Principles

Numbered, scannable rules. Each rule must be:
- **Actionable** — tells the agent what to DO
- **Testable** — can be verified mechanically or by review
- **Independent** — stands on its own without depending on other rules' ordering

```markdown
## 1. Core Principles

1. **Strictly avoid `any`**: Use `unknown` with type narrowing when the type is undetermined.
2. **Explicit return types**: All exported functions must declare return types.
3. **Exhaustive matching**: Enforce `never` in switch/case over discriminated unions.
```

### 2. Standard Operating Procedure

Step-by-step actions the agent follows when the skill activates. Include decision points with clear criteria.

```markdown
## 2. Standard Operating Procedure

1. Check if the target file is inside `src/modules/`.
2. Identify the layer (domain, application, infrastructure, presentation).
3. Apply layer-specific rules:
   - Domain: no external imports allowed.
   - Application: one use case per file, Zod-validated input.
4. Run verification script if available.
```

### 3. Code Examples

At minimum, one **correct** example. Ideally, show both correct (✅) and incorrect (❌) patterns for contrast:

```markdown
## 3. Code Examples

​```typescript
// ✅ Correct — safe type narrowing with Zod
function parsePayload(input: unknown): UserDto {
  return UserDtoSchema.parse(input);
}

// ❌ Incorrect — unsafe cast
function parsePayload(input: any): UserDto {
  return input as UserDto;
}
​```
```

### 4. Callouts

Point to templates and scripts at the end:

```markdown
> [!TIP]
> Boilerplate templates at: `.skills/<name>/templates/`

> [!IMPORTANT]
> Run verification: `bash .skills/<name>/scripts/verify.sh`
```

---

## Workspace Skill Structure

Workspace Skills define **how** to execute a procedure. Organize the body as:

### Overview

Brief description of the skill's purpose, the persona the agent should adopt (if any), and what success looks like.

### On Activation

Steps the agent executes when first loaded: load config, check prerequisites, greet user, present options or resume.

### Workflow

The main procedure with clear phases, decision points, and loops. Use subheadings for distinct phases. Reference supplementary docs in `references/` when sections get long.

### Output

What artifacts the skill produces, where they're stored, and in what format.

---

## Length Guidelines

| Content | Guideline |
|---|---|
| SKILL.md total | Target <200 lines |
| Core Principles | 3–10 rules |
| Code examples | 1–3 focused snippets |
| Each reference file | Focused on one topic |

When SKILL.md approaches 200 lines, extract supplementary content to `references/`:
- Detailed specs → `references/<topic>-spec.md`
- Decision matrices → `references/<topic>-guide.md`
- Extended examples → `references/examples.md`
