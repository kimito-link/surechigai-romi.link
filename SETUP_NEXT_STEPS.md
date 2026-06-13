# 次のステップ - DATABASE_URLの設定

## 現在の状況

`.env.local`ファイルの`DATABASE_URL`がコメントアウトされています。

## 実行手順

### Step 1: .env.localを編集

`.env.local`ファイルを開いて、`DATABASE_URL`のコメントアウトを解除し、実際のデータベース接続文字列を設定してください。

```bash
# エディタで開く
notepad .env.local
# または
code .env.local
```

**変更前:**
```
# DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

**変更後（実際の接続文字列に置き換えてください）:**
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

**注意**: 
- `user`, `password`, `host`, `5432`, `database` を実際の値に置き換えてください
- MySQL/TiDBを使用している場合は、`postgresql://` の代わりに `mysql://` を使用してください

### Step 2: 環境変数を読み込んで実行

Git Bashで以下を実行：

```bash
# .env.localからDATABASE_URLを読み込む
export DATABASE_URL=$(grep -v '^#' .env.local | grep "^DATABASE_URL=" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# 確認
echo $DATABASE_URL

# マイグレーション実行
pnpm drizzle-kit migrate

# コスト設定の初期化
npx tsx scripts/init-api-cost-settings.ts
```

### Step 3: 一括実行（推奨）

```bash
export DATABASE_URL=$(grep -v '^#' .env.local | grep "^DATABASE_URL=" | cut -d '=' -f2 | tr -d '"' | tr -d "'") && pnpm drizzle-kit migrate && npx tsx scripts/init-api-cost-settings.ts
```

## データベース接続文字列の形式

### MySQL/TiDBの場合
```
DATABASE_URL="mysql://user:password@host:3306/database"
```

### PostgreSQLの場合
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

## データベース接続情報の取得方法

### Railwayの場合
1. Railwayダッシュボードにログイン
2. プロジェクトを選択
3. Database → Variables から `DATABASE_URL` をコピー

### Vercelの場合
1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables から `DATABASE_URL` をコピー

### その他のホスティングサービスの場合
各サービスのドキュメントを参照してください。

## 実行後の確認

1. **管理画面で確認**
   ```
   http://localhost:3000/admin/api-usage
   ```

2. **データベースで確認（オプション）**
   ```sql
   SELECT * FROM api_cost_settings;
   SELECT COUNT(*) FROM api_usage;
   ```

## トラブルシューティング

### DATABASE_URLが空の場合

```bash
# .env.localの内容を確認
cat .env.local | grep DATABASE_URL

# 手動で設定
export DATABASE_URL="your-actual-database-url"
```

### 接続エラーが発生する場合

1. データベース接続文字列が正しいか確認
2. データベースサーバーが起動しているか確認
3. ファイアウォール設定を確認
4. SSL設定が必要な場合は、接続文字列にSSLパラメータを追加
