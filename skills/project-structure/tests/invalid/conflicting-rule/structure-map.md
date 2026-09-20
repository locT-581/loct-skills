# Project Structure Map — Conflict

> Last reconciled: 2024-01-15

## Authority Sources

- doc:ARCHITECTURE.md (last checked: 2024-01-15)
- doc:ADR-014.md (last checked: 2024-01-15)

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| feature | component | `src/components/` | PascalCase.tsx | doc:ARCHITECTURE.md | documented |
| feature | component | `src/features/ui/` | PascalCase.tsx | doc:ADR-014.md | documented |

## Naming Defaults

- Components: `PascalCase.tsx`

## Notes

Invalid: two authoritative rules for (feature, component) with different targets.
