#!/bin/bash
# APIコスト管理セットアップスクリプト（Git Bash用）
# 実行: bash scripts/run-api-setup-gitbash.sh

set -e

echo "=========================================="
echo "APIコスト管理セットアップ"
echo "=========================================="
echo ""

# .env.localからDATABASE_URLを読み込む
if [ -f ".env.local" ]; then
    echo "📄 .env.localファイルを読み込み中..."
    # DATABASE_URLの行を抽出してexport
    while IFS= read -r line; do
        # コメント行と空行をスキップ
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            # DATABASE_URL=の行を探す
            if [[ "$line" =~ ^[[:space:]]*DATABASE_URL= ]]; then
                # 値を抽出（クォートを削除）
                value=$(echo "$line" | sed -E "s/^[[:space:]]*DATABASE_URL=[\"']?([^\"']*)[\"']?/\1/")
                export DATABASE_URL="$value"
                echo "✅ DATABASE_URLを読み込みました"
                break
            fi
        fi
    done < .env.local
else
    echo "⚠️  .env.localファイルが見つかりません"
fi

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
    echo "❌ エラー: DATABASE_URLが設定されていません"
    echo ""
    echo ".env.localファイルに以下を追加してください:"
    echo "  DATABASE_URL=\"your-database-connection-string\""
    echo ""
    exit 1
fi

echo "✅ DATABASE_URLが設定されています"
echo ""

# Step 1: マイグレーション実行
echo "Step 1: データベースマイグレーションを実行中..."
echo "----------------------------------------"
pnpm drizzle-kit migrate
echo ""

# Step 2: コスト設定の初期化
echo "Step 2: コスト設定を初期化中..."
echo "----------------------------------------"
npx tsx scripts/init-api-cost-settings.ts
echo ""

echo "=========================================="
echo "✅ セットアップ完了！"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "1. 管理画面 (/admin/api-usage) で設定を確認"
echo "2. API呼び出しをテストして使用量が記録されるか確認"
echo "3. X APIの実際の従量課金価格を確認して server/db/api-usage-db.ts を更新"
echo ""
