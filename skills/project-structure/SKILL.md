---
name: "project-structure"
version: "3.2.0"
description: "Pre-file-creation guard that discovers, revalidates, and enforces directory structure conventions. Always active; remains passive until a file or directory is about to be created."
triggers:
  globs: []
  intents: []
  default_mode: "always"
dependencies: []
---

# Project Structure — Pre-Create Guard

Intercepts every file creation to ensure placement follows the project's documented conventions. Maintains a `structure-map.md` as a persisted structure contract — not an absolute truth, but a decision cache that is revalidated against authoritative sources on every use.

## 1. Core Invariants

1. **Pre-create gate**: Resolve placement before every new file. Remain passive when no file or directory creation is involved.
2. **Documented intent over observed state**: Project documentation and confirmed decisions outrank accidental folder patterns. A directory with 50 files does not make it policy — documentation or explicit confirmation does.
3. **Revalidate, don't blindly trust**: Compare saved structure rules against current authoritative sources on every use. A stale map that conflicts with updated documentation must be flagged, not silently followed.
4. **Ask only on material ambiguity**: When authoritative sources already resolve placement unambiguously, derive the rule directly. Question the user only when sources are missing, insufficient, or conflicting.
5. **Never promote inference to policy**: Inferred conventions from directory scanning are evidence, not authority. Only `documented` or `confirmed` rules may authorize file creation.
6. **Persist confirmed decisions**: Every new placement decision, once confirmed, becomes a reusable rule with typed source attribution.
7. **Scope-aware placement**: File type alone is insufficient. Combine file type + architectural scope + domain/feature ownership to resolve placement. Scope must be specific enough that `(Scope, File Type)` resolves to one structural intent.
8. **No silent architectural expansion**: Creating a new structural boundary (top-level directory, new architectural layer) requires documentation or explicit user confirmation. Expanding within an existing confirmed structure is allowed.

## 2. Authority Precedence

Resolution is **scope-first, then explicitness, then source authority**. Nearest applicable authoritative rule normally beats a broader generic rule, unless the broader rule explicitly declares it applies globally and cannot be overridden.

```text
1. Current explicit user instruction for the owning scope
2. Explicit project instruction for that scope (instruction:AGENTS.md)
3. Nearest package/module architectural decision (doc:ADR-014.md)
4. Broader repository architectural documentation (doc:ARCHITECTURE.md)
5. Confirmed structure-map rule for the applicable scope
6. Observed consistent repository patterns
7. Inference from directory scanning
```

When a current user instruction conflicts with existing documentation, do not silently overwrite. Flag the architecture change, persist the new confirmed rule, and mark the conflicting documentation as needing reconciliation.

## 3. Standard Operating Procedure

### Phase 1 — Resolve Scope

1. Identify which project, package, or module owns the file being created.
2. Locate the nearest applicable `structure-map.md`:
   - Single repo → project root.
   - Monorepo → check for a map in the owning package first, fall back to root. A package-level map inherits parent rules unless it explicitly overrides them.
3. A rule's identity is its `(Scope, File Type)` pair. A package-level rule with the same key overrides the parent rule. Rules with different keys are additive.
4. If no map exists anywhere, proceed to Phase 2 discovery.

### Phase 2 — Discover / Revalidate

**Always runs** — even when a map exists. Discovery is scoped to what is relevant, not exhaustive.

1. Read `structure-map.md` if present (as starting point, not final answer).
2. Revalidate against authoritative sources:
   - Read sources already referenced by applicable rules (listed in Authority Sources section).
   - Check for newly added or more specific applicable authority sources since the last reconciliation, where repository history or file discovery makes that determinable. Do not rely on filesystem timestamps to infer architecture priority.
   - Inspect current repository structure only where needed to resolve the current placement.
   - Expand discovery scope only when drift or ambiguity is detected.
3. Compare map rules against authoritative docs. Flag any drift:
   - Map says `src/components/` but ARCHITECTURE.md now says `src/features/<feature>/components/` → **drift**.
   - A documented rule that has no corresponding map entry → **gap**.
4. When scanning repository structure (no docs or insufficient docs):
   - Scan representative source directories adaptively, expanding depth where structure remains relevant.
   - Ignore generated/vendor/build/cache directories: `node_modules`, `dist`, `build`, `.next`, `coverage`, `vendor`, `.git`, `generated`, `__pycache__`, `.cache`.
5. Apply conditional discovery:

| Situation | Action |
|---|---|
| Docs explicit, non-conflicting, map aligned | Use rules directly |
| Docs explicit but map has drift | Flag conflict, propose reconciliation, ask only if resolution is ambiguous |
| Docs incomplete, repo patterns clear | Infer only the rule needed for the current creation, require confirmation |
| No docs, no map | Infer the minimum structure necessary to resolve the current creation. Expand the map incrementally — do not require a full project structure audit to create one file |

### Phase 3 — Resolve Placement

1. Match the file's purpose + architectural scope + domain to rules in the validated map.
2. Resolution:
   - **0 matches** → unresolved. Ask user. Do not create.
   - **1 unambiguous match** → proceed to Phase 4.
   - **>1 viable matches** → resolve by scope specificity (feature-local > shared, nearest scope > broad). If still ambiguous → ask user.
3. **Hard gate**: file creation is blocked until placement resolves to exactly one authorized path.

### Phase 4 — Persist & Create

1. If the decision is new or updated, persist the confirmed rule to the map that owns the resolved scope. Package-specific decisions go into the package's `structure-map.md`; repository-wide decisions go into the root map.
2. Directory creation policy:
   - Child directory under a confirmed rule (e.g., `src/features/orders/services/`) → create silently.
   - New structural boundary (e.g., `src/domain/`, new top-level dir) → require explicit confirmation unless documentation already authorizes it.
3. Create the file.

## 4. Structure Map Format

```markdown
# Project Structure Map — MyProject

> Last reconciled: 2024-01-15

## Authority Sources
- doc:ARCHITECTURE.md (last checked: 2024-01-15)
- instruction:AGENTS.md (last checked: 2024-01-15)
- user:2024-01-10

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| shared | component | `src/components/` | PascalCase.tsx | doc:ARCHITECTURE.md | documented |
| feature | component | `src/features/<feature>/components/` | PascalCase.tsx | user:2024-01-10 | confirmed |
| shared | utility | `src/lib/` | camelCase.ts | instruction:AGENTS.md | confirmed |

## Naming Defaults
- Components: `PascalCase.tsx`
- Utilities / helpers: `camelCase.ts`

## Notes
Project-specific decisions and rationale.
```

**Typed provenance — Source prefix format:**

| Prefix | Valid Status | Meaning | Verifier checks |
|---|---|---|---|
| `doc:<path>` | `documented` | Derived from project documentation | Path must exist; not a symlink; within repo root; listed in Authority Sources |
| `instruction:<path>` | `confirmed` | From explicit project instructions (AGENTS.md) | Path must exist; not a symlink; within repo root; listed in Authority Sources |
| `user:<context>` | `confirmed` | Explicit user decision | Context must be non-empty; listed in Authority Sources |
| `observed:<desc>` | `observed` | Inferred from existing repo patterns | Description must be non-empty; cannot authorize creation |
| `inference:<desc>` | `inferred` | AI-generated suggestion | Description must be non-empty; cannot authorize creation |

Every Authority Sources entry must use a valid typed prefix (`doc:`, `instruction:`, or `user:`) and is validated independently — even entries not referenced by any rule must resolve.

Authority documents must not be symbolic links. Target directories must be relative, end with `/`, and stay within the repository boundary.

> [!TIP]
> Template for `structure-map.md`: `.skills/project-structure/templates/structure-map.md.template`

> [!IMPORTANT]
> Run contract verification: `bash .skills/project-structure/scripts/verify.sh`
