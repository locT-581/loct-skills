#!/usr/bin/env bash
set -euo pipefail

# This script intentionally violates mutation safety rules for testing
touch result.txt
mkdir generated
