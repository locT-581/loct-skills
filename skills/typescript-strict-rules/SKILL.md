---
name: "typescript-strict-rules"
version: "1.0.0"
description: "Strict TypeScript standards (Strict Typing, No Any, Exhaustive Checking, Zod Validation)"
triggers:
  globs:
    - "**/*.ts"
    - "**/*.tsx"
  intents:
    - "write typescript code"
    - "define types/interfaces"
    - "validate input schema"
  default_mode: "auto"
dependencies: []
---

# TypeScript Strict Rules & Best Practices

## Core Principles

1. **Strictly avoid `any`**: Use `unknown` combined with type narrowing (type guards) when the data type is undetermined.
2. **Prefer `type` for union/intersection and `interface` for data contracts/objects**: Maintain consistency across the codebase.
3. **Explicit Return Types**: All exported public functions and methods must declare explicit return types.
4. **Exhaustive Matching**: Always enforce `never` type checking in `switch/case` statements over discriminated unions.
5. **Runtime Validation with Zod**: All untrusted external inputs entering the system (API requests, form inputs, local storage) must be validated via Zod schemas prior to static typing.

## Code Examples

```typescript
// Safe type narrowing
function parsePayload(input: unknown): UserDto {
  return UserDtoSchema.parse(input);
}

// Exhaustive check
type Action = { type: "increment" } | { type: "decrement" };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}
```
