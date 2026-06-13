#!/usr/bin/env bash
set -euo pipefail

# Gate 1: 危険変更検知（OAuth・認証・デプロイ系）+ 禁止ワード検知
# - 危険ファイルを触った → 警告（PRで証跡必須）
# - 禁止ワードを diff に含んだ → 失敗

BASE="${1:-origin/main}"
HEAD="${2:-HEAD}"

echo "== Diff Check =="
echo "BASE=$BASE"
echo "HEAD=$HEAD"

CHANGED="$(git diff --name-only "$BASE" "$HEAD" 2>/dev/null)"
echo "$CHANGED"

echo ""
echo "== Dangerous files check =="

# このリポジトリ構成に合わせた危険パス（触ったら PR で証跡必須）
DANGEROUS_REGEX='(^server/_core/oauth|^server/_core/auth|^server/_core/login|^server/_core/session|^server/_core/index\.ts$|^vercel\.json$|^\.github/workflows/|^railway\.json$|^drizzle/|^\.env|^server/_core/health\.ts)'

if echo "$CHANGED" | grep -E "$DANGEROUS_REGEX" >/dev/null 2>&1; then
  echo "⚠️ Dangerous files touched:"
  echo "$CHANGED" | grep -E "$DANGEROUS_REGEX" || true
  echo ""
  echo "Required: add 'OAuth/Deploy verification' evidence in PR."
fi

echo ""
echo "== Forbidden words check (copy/UX) =="
FORBIDDEN='(必ず|確実|保証|成功する|売れる|バズる|絶対|誰でも|最短で|効果絶大)'
TARGETS="$(echo "$CHANGED" | grep -E '\.(ts|tsx|md)$' || true)"

if [ -n "${TARGETS:-}" ]; then
  DIFF_OUTPUT=""
  if git rev-parse "$BASE" >/dev/null 2>&1 && git rev-parse "$HEAD" >/dev/null 2>&1; then
    DIFF_OUTPUT="$(git diff "$BASE" "$HEAD" -- $TARGETS 2>/dev/null)"
  fi
  if echo "$DIFF_OUTPUT" | grep -qE "$FORBIDDEN"; then
    echo "❌ Forbidden words detected in diff:"
    echo "$DIFF_OUTPUT" | grep -nE "$FORBIDDEN" || true
    exit 1
  fi
fi

echo "✅ Diff check passed."
