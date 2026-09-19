---
name: "missing-strict-mode"
version: "1.0.0"
description: "This skill has a script using set -e instead of set -euo pipefail"
triggers:
  globs: []
  intents:
    - "test missing strict mode"
  default_mode: "auto"
dependencies: []
---

# Missing Strict Mode

Should fail: scripts/weak.sh uses set -e instead of set -euo pipefail.
