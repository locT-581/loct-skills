---
name: "wrong-name"
version: "1.0.0"
description: "This skill's name does not match the directory name (name-mismatch)"
triggers:
  globs: []
  intents:
    - "test name mismatch"
  default_mode: "auto"
dependencies: []
---

# Name Mismatch

Should fail: name 'wrong-name' does not match directory 'name-mismatch'.
