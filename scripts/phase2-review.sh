#!/bin/bash
# Phase 2: ログインUX改善
# GitHub Copilot CLIを使用したコードレビュースクリプト

set -e

echo "🔍 Phase 2 Code Review with GitHub Copilot CLI"
echo "================================================"
echo ""

# カレントブランチを取得
CURRENT_BRANCH=$(git branch --show-current)
echo "📌 Current branch: $CURRENT_BRANCH"
echo ""

# Phase 2実装ガイドを読み込む
GUIDE_PATH="docs/phase2-implementation-guide.md"
if [ ! -f "$GUIDE_PATH" ]; then
  echo "❌ Phase 2実装ガイドが見つかりません: $GUIDE_PATH"
  exit 1
fi

echo "📖 Phase 2実装ガイドを読み込んでいます..."
echo ""

# レビュー対象ファイルを取得（mainとの差分）
echo "📂 レビュー対象ファイル:"
git diff --name-only main | grep -E '\.(ts|tsx|js|jsx)$' || echo "  (差分なし)"
echo ""

# レビューコンテキストを作成
CONTEXT="
# Phase 2実装レビュー依頼

以下のPhase 2実装ガイドに基づいて、コードレビューをお願いします。

## 重要なチェック項目

### 1. NG集（触ってはいけないファイル）
- app/oauth/**
- server/twitter*
- hooks/use-auth.ts（login関数の実装部分）
- lib/auth-provider.tsx

### 2. 禁止ワード
- callback
- oauth
- pkce
- code_verifier
- redirect_uri
- state=
- token
- twitter-callback

### 3. FSM状態遷移の妥当性
- idle → confirm → redirecting → waitingReturn → success/cancel/error
- 不正な状態遷移がないか
- 状態管理がFSM以外で分岐していないか

### 4. login()の扱い
- login()は黒箱として扱っているか
- 成否はAuth Contextが管理しているか
- UIは状態に追従するだけか

### 5. レスポンシブデザイン
- 375px（モバイル）で正しく表示されるか
- 768px（タブレット）で正しく表示されるか
- 1024px以上（デスクトップ）で正しく表示されるか

## Phase 2実装ガイド

$(cat $GUIDE_PATH)

## レビュー対象の差分

"

# GitHub Copilot CLIでレビュー実行
echo "🤖 GitHub Copilot CLIでレビューを実行しています..."
echo ""
echo "コンテキスト:"
echo "$CONTEXT"
echo ""
echo "差分:"
git diff main

echo ""
echo "📝 レビュー結果:"
echo ""

# gh copilot suggestを使用（対話的）
echo "$CONTEXT" | gh copilot suggest "Phase 2実装ガイドに基づいて、以下の差分をレビューしてください。特にNG集と禁止ワードに違反していないか、FSM状態遷移が正しいか、login()を黒箱として扱っているかを確認してください。"

echo ""
echo "✅ レビュー完了"
echo ""
echo "📋 次のステップ:"
echo "  1. レビュー結果を確認"
echo "  2. 指摘事項があれば修正"
echo "  3. ユニットテストを実行: pnpm test"
echo "  4. diff-check CIを確認"
echo "  5. 手動1分儀式を実行"
