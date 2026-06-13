# 🚀 最終セットアップ手順 - 今すぐ実行

## ⚠️ 重要: DATABASE_URLの設定が必要です

`.env.local`ファイルに実際のデータベース接続文字列を設定してください。

## Step 1: .env.localを編集

```bash
# エディタで開く
notepad .env.local
# または
code .env.local
```

`.env.local`ファイルの以下の行を編集：

**変更前:**
```
DATABASE_URL=""
```

**変更後（実際の接続文字列に置き換えてください）:**

### MySQL/TiDBの場合:
```
DATABASE_URL="mysql://user:password@host:3306/database"
```

### PostgreSQLの場合:
```
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

## Step 2: 自動セットアップスクリプトを実行

Git Bashで以下を実行：

```bash
bash scripts/auto-setup.sh
```

このスクリプトは以下を自動実行します：
1. ✅ `.env.local`から`DATABASE_URL`を読み込み
2. ✅ データベースマイグレーション実行（`api_usage`と`api_cost_settings`テーブル作成）
3. ✅ コスト設定の初期化
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

## 完了した実装内容

✅ データベーススキーマ（`api_usage`, `api_cost_settings`）
✅ API呼び出しの自動記録機能
✅ コスト計算機能（月100件まで無料、超過分は $0.01/件）
✅ コスト上限アラート機能
✅ 管理画面でのコスト表示
✅ フォロー状態のキャッシュ最適化（24時間）
✅ マイグレーションファイル（`drizzle/0027_api_usage_tracking.sql`）
✅ 初期設定スクリプト（`scripts/init-api-cost-settings.ts`）

## 次のアクション

1. ⚠️ **必須**: `.env.local`に実際の`DATABASE_URL`を設定
2. ✅ `bash scripts/auto-setup.sh` を実行
3. ✅ 管理画面で動作確認

## スコープ外（この手順では実施しない）

以下は今回のセットアップの対象外です。必要に応じて既存の手順に従って別途実施してください。

| 項目 | 対応 |
|------|------|
| **UptimeRobot / Sentry の手動設定** | 既存の MD の手順のまま手動で設定（例: docs/gate1.md, Sentry 関連ドキュメント） |
| **サムネイル表示不具合の調査・修正** | 別 issue で対応することを推奨 |
