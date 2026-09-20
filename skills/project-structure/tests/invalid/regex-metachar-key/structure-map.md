# Project Structure Map — RegexMetachar

> Last reconciled: 2024-01-15

## Authority Sources

- user:2024-01-15

## Placement Rules

| Scope | File Type | Target Directory | Naming | Source | Status |
|---|---|---|---|---|---|
| shared[web] | component (React) | `src/a/` | PascalCase.tsx | user:2024-01-15 | confirmed |
| shared[web] | component (React) | `src/b/` | PascalCase.tsx | user:2024-01-10 | confirmed |

## Naming Defaults

- Components: `PascalCase.tsx`

## Notes

Invalid: scope contains regex metacharacters [] and file type contains ().
Must still detect the conflict without regex errors.
