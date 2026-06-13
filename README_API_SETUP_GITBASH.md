# APIコスト管理セットアップ - Git Bash実行手順

## 🚀 Git Bashでの実行方法

Git Bash（MINGW64）を使用している場合の実行手順です。

### 方法1: bashスクリプトを使用（推奨）

```bash
# bashスクリプトを実行
bash scripts/run-api-setup.sh
```

### 方法2: 手動でコマンドを実行

```bash
# Step 1: .env.localからDATABASE_URLを読み込む（オプション）
export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)

# Step 2: マイグレーション実行
pnpm drizzle-kit migrate

# Step 3: コスト設定の初期化
npx tsx scripts/init-api-cost-settings.ts
```

### 方法3: PowerShellスクリプトを実行（Windowsの場合）

```bash
# PowerShell経由で実行
powershell -ExecutionPolicy Bypass -File scripts/run-api-setup.ps1
```

## 📋 実行前の確認

### DATABASE_URLの設定確認

`.env.local` ファイルに `DATABASE_URL` が設定されているか確認：

```bash
# .env.localの内容を確認（DATABASE_URLの行のみ）
grep DATABASE_URL .env.local
```

設定されていない場合は、`.env.local` に追加：

```bash
DATABASE_URL="your-database-connection-string"
```

## ✅ 実行後の確認

1. **管理画面で確認**
   ```
   http://localhost:3000/admin/api-usage
   ```

2. **データベースで確認（オプション）**
   ```sql
   SELECT * FROM api_cost_settings;
   SELECT COUNT(*) FROM api_usage;
   ```

## 🐛 トラブルシューティング

### DATABASE_URLが見つからない

**エラー**: `DATABASE_URL is not set`

**解決方法**:
```bash
# .env.localから読み込む
export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)

# または直接設定
export DATABASE_URL="your-database-url"
```

### pnpmコマンドが見つからない

**解決方法**:
```bash
# pnpmをインストール
npm install -g pnpm
```

### tsxコマンドが見つからない

**解決方法**:
```bash
# 依存関係をインストール
pnpm install
```
