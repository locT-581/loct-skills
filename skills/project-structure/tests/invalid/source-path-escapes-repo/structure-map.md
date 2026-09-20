# Project Structure Map — PathEscape

> Last reconciled: 2024-01-15

## Authority Sources

- doc:../../../../etc/hosts (last checked: 2024-01-15)

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| shared | service | `src/services/` | PascalCase.ts | doc:../../../../etc/hosts | documented |

## Naming Defaults

- Services: `PascalCase.ts`

## Notes

Invalid: doc: path traverses outside repository root via ../../../.
