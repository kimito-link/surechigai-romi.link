# APIコスト管理セットアップ - クイックスタート

## Git Bashでの実行手順

### Step 1: .env.localからDATABASE_URLを読み込む

```bash
# .env.localからDATABASE_URLを読み込む
export DATABASE_URL=$(grep -v '^#' .env.local | grep DATABASE_URL | cut -d '=' -f2 | tr -d '"' | tr -d "'")
```

### Step 2: DATABASE_URLが設定されたか確認

```bash
# 確認
echo $DATABASE_URL
```

### Step 3: マイグレーション実行

```bash
pnpm drizzle-kit migrate
```

### Step 4: コスト設定の初期化

```bash
npx tsx scripts/init-api-cost-settings.ts
```

## 一括実行（推奨）

```bash
# 一行で実行
export DATABASE_URL=$(grep -v '^#' .env.local | grep DATABASE_URL | cut -d '=' -f2 | tr -d '"' | tr -d "'") && pnpm drizzle-kit migrate && npx tsx scripts/init-api-cost-settings.ts
```

## .env.localにDATABASE_URLがない場合

`.env.local`ファイルを開いて、以下を追加してください：

```bash
# エディタで開く
notepad .env.local
# または
code .env.local
```

`.env.local`に以下を追加：
```
DATABASE_URL="your-database-connection-string"
```

## トラブルシューティング

### DATABASE_URLが空の場合

```bash
# .env.localの内容を確認
cat .env.local | grep DATABASE_URL

# 手動で設定
export DATABASE_URL="your-database-url-here"
```

### pnpmコマンドが見つからない場合

```bash
# pnpmをインストール
npm install -g pnpm
```

### tsxコマンドが見つからない場合

```bash
# 依存関係をインストール
pnpm install
```
