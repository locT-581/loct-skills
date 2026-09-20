# Project Structure Map — StaleAuth

> Last reconciled: 2024-01-15

## Authority Sources

- doc:ARCHITECTURE.md (last checked: 2024-01-15)
- doc:MISSING.md (last checked: 2024-01-15)

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| shared | service | `src/services/` | PascalCase.ts | doc:ARCHITECTURE.md | documented |

## Naming Defaults

- Services: `PascalCase.ts`

## Notes

Invalid: doc:MISSING.md is in Authority Sources but the file does not exist.
Even though no rule references it, the registry entry itself must resolve.
