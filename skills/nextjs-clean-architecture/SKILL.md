---
name: "nextjs-clean-architecture"
version: "1.2.0"
description: "Clean Architecture guidelines for Next.js App Router (Server Components, Actions, Repository Pattern)"
triggers:
  globs:
    - "src/app/**/*.{ts,tsx}"
    - "src/modules/**/*.{ts,tsx}"
  intents:
    - "create new server action"
    - "refactor module to clean architecture"
    - "design repository layer"
  default_mode: "auto"
dependencies:
  - "typescript-strict-rules"
---

# Next.js Clean Architecture Guidelines

This document defines the application architecture for Next.js using the App Router based on Clean Architecture and lightweight Domain-Driven Design (DDD) principles.

## 1. Layer Boundaries

The project is decomposed into independent layers following inward dependency flow:

```
[Presentation / UI] (Server & Client Components)
       ↓
[Application / Use Cases] (Server Actions, Orchestration, Business Rules)
       ↓
[Domain] (Entities, Value Objects, Domain Interfaces)
       ↑ (implements)
[Infrastructure] (Database ORM, External APIs, Email, Caching)
```

1. **Domain Layer (`src/modules/<module>/domain/`)**:
   - Contains pure TypeScript entity types and repository interfaces.
   - Absolutely MUST NOT import any external libraries or frameworks (Next.js, Prisma, Drizzle, React).
2. **Application Layer (`src/modules/<module>/application/`)**:
   - Contains Use Cases (1 file = 1 use case).
   - Each Use Case receives Zod-validated input, calls Domain Repositories, and returns a Result type (`{ success: true, data } | { success: false, error }`).
3. **Infrastructure Layer (`src/modules/<module>/infrastructure/`)**:
   - Implements Repository interfaces using ORM/Database clients.
4. **Presentation Layer (`src/app/` or `src/modules/<module>/presentation/`)**:
   - React Server Components fetch data through Use Cases.
   - Client Components trigger Server Actions (wrapped in Use Cases).

## 2. Key Rules

- **Server Components by default**: Every component is a Server Component unless it requires `useState`, `useEffect`, or event handlers (`'use client'`).
- **Data Mutation**: All mutations are executed via Next.js Server Actions or Route Handlers, delegated directly to Application Use Cases.
- **Error Handling**: Do not throw unhandled exceptions in use cases; return type-safe error objects instead.

> [!TIP]
> - View Use Case template code at: `.skills/nextjs-clean-architecture/templates/use-case.ts.template`
> - View Repository template code at: `.skills/nextjs-clean-architecture/templates/repository.ts.template`

> [!IMPORTANT]
> To verify architecture compliance, you can run:
> `bash .skills/nextjs-clean-architecture/scripts/verify.sh`
