# Anti-Patterns — What NOT to Do

Common mistakes when authoring skills and how to fix them.

---

## Structural Anti-Patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| SKILL.md exceeds 200 lines | Context window bloat; wastes tokens every activation | Extract supplementary content to `references/` |
| Mixing rules with workflow steps | Confusing — is this a standard or a procedure? | Separate into Core Principles (rules) vs SOP (procedure) |
| Circular or excessive dependencies | Install friction, version conflicts, dependency hell | Keep the list flat and minimal |
| No directory structure matches name | CLI can't resolve the skill | `name` field must exactly match directory name |

## Content Anti-Patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Vague description like "helps with code" | Agent can't route to the skill; competes with everything | Be precise: "Enforces X pattern in Y context" |
| No code examples | Agent guesses implementation (often wrong) | Include at least 1 correct example per major rule |
| Templates with unexplained placeholders | Agent fills `{{thing}}` with nonsense | Comment each `{{placeholder}}` explaining what goes there |
| Dumping entire documentation into SKILL.md | Kills context budget for the conversation | Use `references/` for extended specs, keep SKILL.md focused |
| Writing skill in a language AI handles poorly | Lower quality agent output | Write skills in English; use user's language for comments/docs if needed |

## Trigger Anti-Patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Overly broad globs like `**/*` or `**/*.ts` | Skill activates on every file, drowning out specificity | Narrow to the actual paths: `src/modules/**/domain/**` |
| Only 1 intent | Low recall — user must phrase it exactly right | Provide 2-5 intents covering common phrasings |
| More than 5 intents | Noise — skill starts matching too broadly | Consolidate to the most distinctive 3-5 phrases |
| Using `default_mode: "always"` casually | Skill loads into every context, permanently | Reserve for truly foundational rules only |

## Safety Anti-Patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Verification scripts that mutate files | Dangerous in CI/CD, production, shared workspaces | Scripts MUST be read-only — grep, typecheck, lint only |
| Scripts that make network requests | Flaky in CI, potential data leak | No outbound network calls in verify scripts |
| Using `eval` in generated scripts | Code injection risk | Never eval generated or user input |
| Scripts that source untrusted files | Arbitrary code execution | Don't source files outside the skill root |
| Paths without quoting in bash | Word splitting breaks on spaces | Always quote: `"$variable"`, `"${path}"` |

## Process Anti-Patterns

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Asking 5 questions before doing anything | Stalls the workflow; user loses patience | Infer safe defaults, ask only for type/behavior/compatibility-changing decisions |
| Delivering without validation report | Inconsistent quality across agents | Always run quality checklist; present report before declaring complete |
| Confusing `skills/` with `.skills/` | Files created in wrong directory | Follow the Path Model: author in `skills/`, consumers see `.skills/` |
| Skipping Step 7 (validation) | Missing critical issues that break CLI or agent routing | Validation is not optional — Critical items must all pass |
