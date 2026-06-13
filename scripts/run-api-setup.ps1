# APIコスト管理セットアップスクリプト (PowerShell版)
# 実行: .\scripts\run-api-setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "APIコスト管理セットアップ" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# .env.localからDATABASE_URLを読み込む
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    $envLines = $envContent -split "`n"
    foreach ($line in $envLines) {
        if ($line -match '^DATABASE_URL=(.+)$') {
            $env:DATABASE_URL = $matches[1].Trim('"''')
            break
        }
    }
}

# DATABASE_URLの確認
if (-not $env:DATABASE_URL) {
    Write-Host "❌ エラー: DATABASE_URLが設定されていません" -ForegroundColor Red
    Write-Host ""
    Write-Host "環境変数を設定してください:"
    Write-Host "  `$env:DATABASE_URL='your-database-url'"
    Write-Host ""
    Write-Host "または、.env.localファイルに設定してください"
    exit 1
}

Write-Host "✅ DATABASE_URLが設定されています" -ForegroundColor Green
Write-Host ""

# Step 1: マイグレーション実行
Write-Host "Step 1: データベースマイグレーションを実行中..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
pnpm drizzle-kit migrate
Write-Host ""

# Step 2: コスト設定の初期化
Write-Host "Step 2: コスト設定を初期化中..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
npx tsx scripts/init-api-cost-settings.ts
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ セットアップ完了！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "次のステップ:"
Write-Host "1. 管理画面 (/admin/api-usage) で設定を確認"
Write-Host "2. API呼び出しをテストして使用量が記録されるか確認"
Write-Host "3. X APIの実際の従量課金価格を確認して server/db/api-usage-db.ts を更新"
Write-Host ""
