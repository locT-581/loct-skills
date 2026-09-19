---
name: "broad-glob"
version: "1.0.0"
description: "This skill uses an overly broad glob pattern that should be rejected"
triggers:
  globs:
    - "**/*"
  intents:
    - "test broad glob"
  default_mode: "auto"
dependencies: []
---

# Broad Glob

Should fail schema validation: glob **/* is explicitly forbidden.
