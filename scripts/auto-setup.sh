#!/bin/bash
# APIコスト管理セットアップ - 自動実行スクリプト
# 実行: bash scripts/auto-setup.sh

set -e

echo "=========================================="
echo "APIコスト管理セットアップ - 自動実行"
echo "=========================================="
echo ""

# .env.localからDATABASE_URLを読み込む
if [ -f ".env.local" ]; then
    echo "📄 .env.localファイルを読み込み中..."
    # DATABASE_URLの行を抽出（コメント行を除外）
    db_url_line=$(grep -v '^#' .env.local | grep "^DATABASE_URL=" | head -1)
    
    if [ -n "$db_url_line" ]; then
        # 値を抽出（クォートを削除）
        DATABASE_URL=$(echo "$db_url_line" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
        
        if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "" ]; then
            export DATABASE_URL
            echo "✅ DATABASE_URLを読み込みました"
        else
            echo "⚠️  DATABASE_URLが空です"
            echo ""
            echo ".env.localファイルを編集して、実際のデータベース接続文字列を設定してください:"
            echo "  DATABASE_URL=\"mysql://user:password@host:3306/database\""
            echo ""
            exit 1
        fi
    else
        echo "⚠️  DATABASE_URLが見つかりません"
        echo ""
        echo ".env.localファイルに以下を追加してください:"
        echo "  DATABASE_URL=\"mysql://user:password@host:3306/database\""
        echo ""
        exit 1
    fi
else
    echo "❌ .env.localファイルが見つかりません"
    exit 1
fi

echo ""

# Step 1: マイグレーション実行
echo "Step 1: データベースマイグレーションを実行中..."
echo "----------------------------------------"
if pnpm drizzle-kit migrate; then
    echo "✅ マイグレーション完了"
else
    echo "❌ マイグレーション失敗"
    exit 1
fi
echo ""

# Step 2: コスト設定の初期化
echo "Step 2: コスト設定を初期化中..."
echo "----------------------------------------"
if npx tsx scripts/init-api-cost-settings.ts; then
    echo "✅ コスト設定完了"
else
    echo "❌ コスト設定失敗"
    exit 1
fi
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
