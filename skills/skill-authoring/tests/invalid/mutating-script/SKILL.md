---
name: "mutating-script"
version: "1.0.0"
description: "This skill has a script that mutates files which should be flagged"
triggers:
  globs: []
  intents:
    - "test mutating script"
  default_mode: "auto"
dependencies: []
---

# Mutating Script

Should fail: scripts/bad.sh contains mutation commands.
