#!/bin/bash
# Phase 2: ログインUX改善
# GitHub Copilot CLIを使用した簡易レビュースクリプト

set -e

echo "🔍 Phase 2 Quick Review with GitHub Copilot CLI"
echo "================================================"
echo ""

# 変更されたファイルを取得
CHANGED_FILES=$(git diff --name-only main | grep -E '\.(ts|tsx)$' || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ レビュー対象のファイルがありません"
  exit 0
fi

echo "📂 レビュー対象ファイル:"
echo "$CHANGED_FILES"
echo ""

# 各ファイルをレビュー
for file in $CHANGED_FILES; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📄 $file"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # NG集チェック
  if echo "$file" | grep -qE '^(app/oauth/|server/twitter|hooks/use-auth\.ts|lib/auth-provider\.tsx)'; then
    echo "⚠️  WARNING: このファイルはNG集に含まれています！"
    echo "   Phase 2では触ってはいけないファイルです。"
    echo ""
  fi
  
  # 禁止ワードチェック
  FORBIDDEN_WORDS=$(git diff main -- "$file" | grep -E '\+(.*)(callback|oauth|pkce|code_verifier|redirect_uri|state=|token|twitter-callback)' || echo "")
  if [ -n "$FORBIDDEN_WORDS" ]; then
    echo "⚠️  WARNING: 禁止ワードが検出されました！"
    echo "$FORBIDDEN_WORDS"
    echo ""
  fi
  
  # GitHub Copilot CLIで差分を説明
  echo "🤖 Copilot CLIによる差分説明:"
  git diff main -- "$file" | gh copilot explain
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ レビュー完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 次のステップ:"
echo "  1. 警告があれば修正"
echo "  2. ユニットテストを実行: pnpm test"
echo "  3. diff-check CIを確認"
echo "  4. 手動1分儀式を実行"
