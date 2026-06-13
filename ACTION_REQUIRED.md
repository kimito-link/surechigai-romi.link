# ⚠️ 必要なアクション - DATABASE_URLの設定

## 現在の状況

✅ **完了していること:**
- APIコスト管理機能のコード実装（100%完了）
- データベースマイグレーションファイル（`0027_api_usage_tracking.sql`）
- 初期化スクリプト（`scripts/init-api-cost-settings.ts`）
- 自動セットアップスクリプト（`scripts/auto-setup.sh`）

❌ **必要なアクション:**
- `.env.local`ファイルの`DATABASE_URL`に**実際のデータベース接続文字列**を設定する必要があります

## 今すぐ実行する手順

### Step 1: `.env.local`を編集

`.env.local`ファイルを開いて、以下の行を編集してください：

**現在:**
```
DATABASE_URL=""
```

**変更後（実際の接続文字列に置き換えてください）:**

**MySQL/TiDBの場合:**
```
DATABASE_URL="mysql://user:password@host:3306/database"
```

**PostgreSQLの場合:**
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### Step 2: 自動セットアップスクリプトを実行

`.env.local`を編集して保存したら、Git Bashで以下を実行：

```bash
bash scripts/auto-setup.sh
```

このスクリプトが以下を自動実行します：
1. ✅ データベースマイグレーション（`api_usage`と`api_cost_settings`テーブル作成）
2. ✅ コスト設定の初期化
   - 月間コスト上限: **$10.00**
   - アラート閾値: **$8.00**
   - アラートメール: **info@best-trust.biz**
   - 自動停止: **有効**

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

## 注意事項

- `DATABASE_URL`は機密情報です。`.gitignore`に`.env.local`が含まれていることを確認してください
- 接続文字列には、ユーザー名、パスワード、ホスト名、データベース名が含まれます
- 実際の値に置き換えてください（`user`, `password`, `host`, `database`などのプレースホルダーは使用できません）
