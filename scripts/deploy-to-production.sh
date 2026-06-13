#!/bin/bash
# デプロイスクリプト（Manusから実行）
# 使い方: ./scripts/deploy-to-production.sh "コミットメッセージ"

set -e

# コミットメッセージ（引数がなければデフォルト）
COMMIT_MSG="${1:-Deploy from Manus: $(date +%Y-%m-%d\ %H:%M:%S)}"

echo "=========================================="
echo "🚀 デプロイを開始します"
echo "=========================================="

# 1. GitHubリポジトリをクローン
echo "📦 GitHubリポジトリをクローン中..."
cd /tmp
rm -rf doin-challenge-deploy
gh repo clone kimito-link/doin-challenge.com doin-challenge-deploy

# 2. Manusの変更をコピー
echo "📋 Manusの変更をコピー中..."
cd doin-challenge-deploy

# 主要ディレクトリをコピー
cp -r /home/ubuntu/birthday-celebration/app .
cp -r /home/ubuntu/birthday-celebration/components .
cp -r /home/ubuntu/birthday-celebration/server .
cp -r /home/ubuntu/birthday-celebration/docs .
cp -r /home/ubuntu/birthday-celebration/scripts .
cp -r /home/ubuntu/birthday-celebration/shared .
cp -r /home/ubuntu/birthday-celebration/features .
cp -r /home/ubuntu/birthday-celebration/lib .
cp -r /home/ubuntu/birthday-celebration/hooks .
cp -r /home/ubuntu/birthday-celebration/constants .
cp -r /home/ubuntu/birthday-celebration/types .

# 設定ファイルをコピー
cp /home/ubuntu/birthday-celebration/sentry.*.ts . 2>/dev/null || true
cp /home/ubuntu/birthday-celebration/todo.md .
cp /home/ubuntu/birthday-celebration/app.config.ts .
cp /home/ubuntu/birthday-celebration/tailwind.config.js .
cp /home/ubuntu/birthday-celebration/theme.config.js .

echo "✅ コピー完了"

# 3. 変更をコミット
echo "💾 変更をコミット中..."
git add -A
git commit -m "$COMMIT_MSG" || echo "⚠️  変更がないため、コミットをスキップしました"

# 4. GitHubにプッシュ
echo "📤 GitHubにプッシュ中..."
git push origin main

echo "=========================================="
echo "✅ デプロイ完了！"
echo "=========================================="
echo ""
echo "📊 GitHub Actionsの実行状況を確認:"
echo "https://github.com/kimito-link/doin-challenge.com/actions"
echo ""
echo "🌐 本番環境（5-10分後に反映）:"
echo "https://doin-challenge.com"
echo ""
