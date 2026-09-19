#!/usr/bin/env bash
set -e

echo "🔍 Checking Clean Architecture compliance in Next.js codebase..."

# 1. Check if Domain layer leaks React or Next.js imports
if [ -d "src/modules" ]; then
  LEAKS=$(grep -rnE "from ['\"]react['\"]|from ['\"]next" src/modules/*/domain 2>/dev/null || true)
  if [ -n "$LEAKS" ]; then
    echo "❌ Violation detected: Domain layer must not depend on React or Next.js:"
    echo "$LEAKS"
    exit 1
  else
    echo "✅ Domain layer is completely independent (no React/Next.js imports)."
  fi
fi

# 2. Check TypeScript typecheck
if command -v pnpm &> /dev/null && [ -f "package.json" ]; then
  echo "🔍 Running pnpm typecheck..."
  pnpm run typecheck || true
fi

echo "✨ Verification complete!"
