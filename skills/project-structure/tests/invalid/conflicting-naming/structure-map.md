# Project Structure Map — NamingConflict

> Last reconciled: 2024-01-15

## Authority Sources

- doc:ARCHITECTURE.md (last checked: 2024-01-15)
- doc:ADR-001.md (last checked: 2024-01-15)

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| feature | component | `src/components/` | PascalCase.tsx | doc:ARCHITECTURE.md | documented |
| feature | component | `src/components/` | kebab-case.tsx | doc:ADR-001.md | documented |

## Naming Defaults

- Components: `PascalCase.tsx`

## Notes

Invalid: same (Scope, File Type) and same Target Directory, but different Naming conventions.
Both are authoritative — this is a conflict.
