---
name: "bad-semver"
version: "01.02.003"
description: "This skill has a version with leading zeros which is not valid semver"
triggers:
  globs: []
  intents:
    - "test bad semver"
  default_mode: "auto"
dependencies: []
---

# Bad SemVer

Should fail schema validation: leading zeros in version.
