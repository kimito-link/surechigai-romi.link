#!/bin/bash

# scripts/check-diff.sh
# 変更ファイルを検出し、影響範囲を分析するスクリプト

set -e

echo "🔍 Checking for file changes..."

# 比較対象のブランチ（デフォルトはgithub/main）
BASE_BRANCH="${1:-github/main}"

# 変更されたファイルを取得
CHANGED_FILES=$(git diff --name-only "$BASE_BRANCH" HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No files changed"
  exit 0
fi

echo "📝 Changed files:"
echo "$CHANGED_FILES"
echo ""

# 重要なファイルの変更をチェック
CRITICAL_FILES=(
  "server/_core/oauth.ts"
  "server/_core/auth.ts"
  "app/(tabs)/_layout.tsx"
  "features/*/components/*.tsx"
)

CRITICAL_CHANGED=false

for pattern in "${CRITICAL_FILES[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "$pattern"; then
    echo "⚠️  Critical file changed: $pattern"
    CRITICAL_CHANGED=true
  fi
done

# 重要なファイルが変更された場合、関連するE2Eテストを実行
if [ "$CRITICAL_CHANGED" = true ]; then
  echo ""
  echo "🧪 Running related E2E tests..."
  
  # OAuth関連の変更があれば、ログインテストを実行
  if echo "$CHANGED_FILES" | grep -q "server/_core/oauth.ts\|server/_core/auth.ts"; then
    echo "Running auth login tests..."
    pnpm exec playwright test tests/e2e/auth.login.spec.ts --reporter=list || {
      echo "❌ Auth login tests failed"
      exit 1
    }
  fi
  
  # UI関連の変更があれば、警告を表示
  if echo "$CHANGED_FILES" | grep -q "\.tsx$\|\.css$\|tailwind.config"; then
    echo "⚠️  UI files changed. Consider running visual regression tests locally:"
    echo "   pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots"
  fi
  
  echo "✅ All related tests passed"
else
  echo "✅ No critical files changed"
fi

echo ""
echo "📊 Summary:"
echo "  Changed files: $(echo "$CHANGED_FILES" | wc -l)"
echo "  Critical changes: $CRITICAL_CHANGED"
