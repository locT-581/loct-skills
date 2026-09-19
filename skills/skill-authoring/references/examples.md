# Skill Examples — Annotated Analysis

This reference analyzes existing high-quality skills in the repository, highlighting what makes them effective and how they apply the Canonical Schema.

---

## Example 1: Registry Skill — `typescript-strict-rules`

**Source:** `skills/typescript-strict-rules/SKILL.md`

**Why it's good:**

1. **Precise description** — "Strict TypeScript standards (Strict Typing, No Any, Exhaustive Checking, Zod Validation)" tells the agent exactly what this covers and when to activate.
2. **Broad but appropriate globs** — `**/*.ts` and `**/*.tsx` make sense because TypeScript rules apply to ALL TypeScript files.
3. **Clear, actionable rules** — Each principle starts with an imperative verb: "Strictly avoid", "Prefer", "Always enforce".
4. **Code examples** — Two concrete snippets demonstrating safe type narrowing and exhaustive checking. The agent can copy and adapt these.
5. **Minimal footprint** — 51 lines, no templates or scripts needed. The skill doesn't try to do more than it should.

**What it could improve:**

- Add ❌ incorrect examples alongside ✅ correct ones for contrast.
- Include a `> [!CAUTION]` about common pitfalls (e.g., using `as` type assertions).

---

## Example 2: Registry Skill — `nextjs-clean-architecture`

**Source:** `skills/nextjs-clean-architecture/SKILL.md`

**Why it's good:**

1. **Visual architecture diagram** — The ASCII diagram of layer boundaries is immediately scannable and tells the agent the mental model before any rules.
2. **Dependency declared** — Lists `typescript-strict-rules` as a dependency, correctly modeling that clean architecture requires strict typing.
3. **Templates provided** — `use-case.ts.template` and `repository.ts.template` give the agent concrete scaffolding to generate code.
4. **Verification script** — `verify.sh` mechanically checks that the domain layer doesn't import React/Next.js, turning a rule into an enforceable check.
5. **TIP + IMPORTANT callouts** — Correctly point to installed paths (`.skills/<name>/templates/`) — the path the downstream consumer sees.
6. **Path model correct** — Template/script references use `.skills/` (downstream installed path), matching where the consumer will find them.

**What it could improve:**

- Add more intents beyond the 3 listed (e.g., "create server action", "add new module").
- Include an anti-patterns section for common architecture violations.
- Upgrade `verify.sh` to use `set -euo pipefail`.

---

## Example 3: Workspace Skill — `bmad-brainstorming`

**Source:** `.agent/skills/bmad-brainstorming/SKILL.md`

**Why it's good:**

1. **Rich workflow** — Complete brainstorming facilitation guide with three modes (Facilitator, Creative Partner, Ideate for me).
2. **Clear activation sequence** — The "On Activation" section lists exact commands to run, configurations to load, and decisions to make.
3. **State management** — Uses a memlog system to persist session state, enabling resume capability.
4. **References for overflow** — Complex sub-procedures extracted to `references/` (e.g., `mode-facilitator.md`, `converge.md`, `finalize.md`) keeping the main SKILL.md focused.
5. **Persona-driven** — "You are a creative brainstorming coach" immediately sets the agent's mindset.
6. **Self-consistent** — Main file stays focused (~80 lines) while the full instruction set spans hundreds of lines across references.

**Patterns worth reusing:**

- The **3-stance model** (Facilitator / Partner / Autonomous) — great template for any interactive skill.
- The **memlog pattern** (init → append → set status) — works for any skill needing state persistence.
- Extracting phases to `references/` — keeps the main file under 200 lines while the skill has extensive instructions.

---

## Key Takeaways

| Principle | Example | Why |
|---|---|---|
| Description is your elevator pitch | `typescript-strict-rules`: 10 words, fully specific | Agent routing depends on it |
| Diagrams > walls of text | `nextjs-clean-architecture`: ASCII art layer diagram | Scannable, unambiguous |
| Templates make rules enforceable | `nextjs-clean-architecture`: use-case.ts.template | Agent generates consistent code |
| Extract complexity to references | `bmad-brainstorming`: 5+ reference files | SKILL.md stays under 200 lines |
| Code examples are non-negotiable | `typescript-strict-rules`: 2 focused snippets | Agent copies patterns, not prose |
| Scripts enforce what prose can't | `nextjs-clean-architecture`: verify.sh | Mechanical validation > good intentions |
| Path model must be consistent | All examples: correct namespace usage | Wrong path = files in wrong directory |
