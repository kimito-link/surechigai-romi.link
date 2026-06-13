#!/bin/bash
# md準拠チェックスクリプト
# mdファイルのチェックリストと実際のコード実装の整合性を検証

set -e

echo "🔍 md準拠チェックを開始..."

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーカウンター
ERRORS=0
WARNINGS=0

# ============================================
# 1. visibility-issues.mdのチェック
# ============================================
echo ""
echo "📋 visibility-issues.mdをチェック中..."

# トークン定義ファイルの存在確認
if [ ! -f "features/events/ui/theme/tokens.ts" ]; then
  echo -e "${RED}❌ features/events/ui/theme/tokens.ts が存在しません${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ トークン定義ファイルが存在します${NC}"
  
  # eventText.usernameの色コードチェック（#FBBF24）
  if grep -q 'username: "#FBBF24"' features/events/ui/theme/tokens.ts; then
    echo -e "${GREEN}✅ eventText.username の色コード (#FBBF24) が正しく設定されています${NC}"
  else
    echo -e "${RED}❌ eventText.username の色コード (#FBBF24) が設定されていません${NC}"
    ERRORS=$((ERRORS + 1))
  fi
  
  # eventText.followerの色コードチェック（#F472B6 または #D1D5DB）
  if grep -q 'follower:.*"#[FD]' features/events/ui/theme/tokens.ts; then
    echo -e "${GREEN}✅ eventText.follower の色コードが設定されています${NC}"
  else
    echo -e "${RED}❌ eventText.follower の色コードが設定されていません${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ContributionRanking.tsxでトークンを使用しているかチェック
if [ -f "features/events/components/ContributionRanking.tsx" ]; then
  if grep -q 'eventText.username' features/events/components/ContributionRanking.tsx; then
    echo -e "${GREEN}✅ ContributionRanking.tsx でトークンを使用しています${NC}"
  else
    echo -e "${YELLOW}⚠️  ContributionRanking.tsx でトークンを使用していません${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# ============================================
# 2. gate1.mdのチェック
# ============================================
echo ""
echo "📋 gate1.mdをチェック中..."

# diff-checkスクリプトの存在確認
if [ ! -f "scripts/diff-check.sh" ]; then
  echo -e "${RED}❌ scripts/diff-check.sh が存在しません${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ diff-checkスクリプトが存在します${NC}"
  
  # 実行権限チェック
  if [ -x "scripts/diff-check.sh" ]; then
    echo -e "${GREEN}✅ diff-checkスクリプトに実行権限があります${NC}"
  else
    echo -e "${YELLOW}⚠️  diff-checkスクリプトに実行権限がありません${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# GitHub Actionsワークフローの存在確認
if [ ! -f ".github/workflows/deploy-vercel.yml" ]; then
  echo -e "${RED}❌ .github/workflows/deploy-vercel.yml が存在しません${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ GitHub Actionsワークフローが存在します${NC}"
  
  # diff-checkステップの存在確認
  if grep -q "diff-check" .github/workflows/deploy-vercel.yml; then
    echo -e "${GREEN}✅ ワークフローにdiff-checkステップが含まれています${NC}"
  else
    echo -e "${YELLOW}⚠️  ワークフローにdiff-checkステップが含まれていません${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # commitSha照合の存在確認
  if grep -q "commitSha" .github/workflows/deploy-vercel.yml; then
    echo -e "${GREEN}✅ ワークフローにcommitSha照合が含まれています${NC}"
  else
    echo -e "${YELLOW}⚠️  ワークフローにcommitSha照合が含まれていません${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# /api/healthエンドポイントの存在確認
if [ -f "server/health.ts" ] || grep -r "api/health" server/ > /dev/null 2>&1; then
  echo -e "${GREEN}✅ /api/healthエンドポイントが実装されています${NC}"
else
  echo -e "${RED}❌ /api/healthエンドポイントが実装されていません${NC}"
  ERRORS=$((ERRORS + 1))
fi

# ============================================
# 3. project-ng-list.mdのチェック
# ============================================
echo ""
echo "📋 project-ng-list.mdをチェック中..."

# 最近のコミットでNG集のファイルが変更されていないかチェック
NG_FILES=(
  "server/_core/oauth.ts"
  "server/_core/auth.ts"
  "vercel.json"
  "railway.json"
)

RECENT_COMMITS=$(git log --oneline -10 --name-only 2>/dev/null || echo "")

if [ -n "$RECENT_COMMITS" ]; then
  for ng_file in "${NG_FILES[@]}"; do
    if echo "$RECENT_COMMITS" | grep -q "$ng_file"; then
      echo -e "${YELLOW}⚠️  最近のコミットで $ng_file が変更されています${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
  
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ NG集のファイルは変更されていません${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Gitリポジトリが見つかりません（スキップ）${NC}"
fi

# ============================================
# 4. critical-features-checklist.mdのチェック
# ============================================
echo ""
echo "📋 critical-features-checklist.mdをチェック中..."

# 管理ダッシュボードのログインチェック
if [ -f "app/admin/index.tsx" ]; then
  if grep -q "if (!user)" app/admin/index.tsx; then
    echo -e "${GREEN}✅ 管理ダッシュボードにログインチェックがあります${NC}"
  else
    echo -e "${RED}❌ 管理ダッシュボードにログインチェックがありません${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# PKCEデータの有効期限チェック（30分）
if [ -f "server/twitter-oauth2.ts" ]; then
  if grep -q "30 \* 60 \* 1000" server/twitter-oauth2.ts; then
    echo -e "${GREEN}✅ PKCEデータの有効期限が30分に設定されています${NC}"
  else
    echo -e "${YELLOW}⚠️  PKCEデータの有効期限が30分に設定されていません${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# ============================================
# 結果サマリー
# ============================================
echo ""
echo "=========================================="
echo "📊 チェック結果サマリー"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ すべてのチェックに合格しました！${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  警告: ${WARNINGS}件${NC}"
  echo ""
  echo "警告は無視できますが、確認することをお勧めします。"
  exit 0
else
  echo -e "${RED}❌ エラー: ${ERRORS}件${NC}"
  echo -e "${YELLOW}⚠️  警告: ${WARNINGS}件${NC}"
  echo ""
  echo "エラーを修正してから再度実行してください。"
  exit 1
fi
