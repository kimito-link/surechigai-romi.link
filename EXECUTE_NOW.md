# 🚀 今すぐ実行する手順

## 重要: DATABASE_URLの設定が必要です

`.env.local`ファイルに実際のデータベース接続文字列を設定してください。

### Step 1: .env.localを編集

```bash
# エディタで開く
notepad .env.local
# または
code .env.local
```

`.env.local`ファイルの`DATABASE_URL=""`の部分を、実際のデータベース接続文字列に置き換えてください：

**MySQL/TiDBの場合:**
```
DATABASE_URL="mysql://user:password@host:3306/database"
```

**PostgreSQLの場合:**
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### Step 2: 自動セットアップスクリプトを実行

```bash
bash scripts/auto-setup.sh
```

このスクリプトは以下を自動実行します：
1. `.env.local`から`DATABASE_URL`を読み込み
2. データベースマイグレーション実行
3. コスト設定の初期化（上限$10、アラート$8、メール info@best-trust.biz、自動停止: 有効）

## データベース接続文字列の取得方法

### Manusを使用している場合
1. Manusダッシュボードにログイン
2. プロジェクトを選択
3. Management UI → Database → Connection Info
4. `DATABASE_URL`をコピー

### Railwayを使用している場合
1. Railwayダッシュボードにログイン
2. プロジェクトを選択
3. Database → Variables
4. `DATABASE_URL`をコピー

### Vercelを使用している場合
1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. `DATABASE_URL`をコピー

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

`.env.local`ファイルを確認：
```bash
cat .env.local | grep DATABASE_URL
```

### 接続エラーが発生する場合

1. データベース接続文字列が正しいか確認
2. データベースサーバーが起動しているか確認
3. ファイアウォール設定を確認
