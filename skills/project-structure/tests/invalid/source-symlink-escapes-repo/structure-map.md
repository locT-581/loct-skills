# Project Structure Map — SymlinkEscape

> Last reconciled: 2024-01-15

## Authority Sources

- doc:ARCH.md (last checked: 2024-01-15)

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| shared | service | `src/services/` | PascalCase.ts | doc:ARCH.md | documented |

## Naming Defaults

- Services: `PascalCase.ts`

## Notes

Invalid: ARCH.md is a symbolic link — authority documents must not be symlinks.
