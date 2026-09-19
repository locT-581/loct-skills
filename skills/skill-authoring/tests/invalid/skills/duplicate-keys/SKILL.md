---
name: "duplicate-keys"
name: "duplicate-keys"
version: "1.0.0"
description: "This skill has duplicate YAML keys in frontmatter"
triggers:
  globs: []
  intents:
    - "test duplicate keys"
  default_mode: "auto"
dependencies: []
---

# Duplicate Keys

Should fail: `name` appears twice in frontmatter.
