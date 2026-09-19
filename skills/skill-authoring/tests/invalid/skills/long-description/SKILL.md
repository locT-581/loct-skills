---
name: "long-description"
version: "1.0.0"
description: "This is an extremely long description that exceeds the maximum of two hundred characters. It keeps going and going with unnecessary verbosity to intentionally trigger the maxLength validation rule in the schema."
triggers:
  globs: []
  intents:
    - "test long description"
  default_mode: "auto"
dependencies: []
---

# Long Description

Should fail schema validation: description exceeds 200 characters.
