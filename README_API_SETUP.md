# APIコスト管理セットアップ - 実行手順

## 🚀 クイックスタート

### Windows (PowerShell)

```powershell
# .env.localからDATABASE_URLを自動読み込みして実行
.\scripts\run-api-setup.ps1
```

### Linux/Mac (Bash)

```bash
# 実行権限を付与（初回のみ）
chmod +x scripts/run-api-setup.sh

# 実行
bash scripts/run-api-setup.sh
```

### 手動実行

```bash
# Step 1: マイグレーション実行
pnpm drizzle-kit migrate

# Step 2: コスト設定の初期化
npx tsx scripts/init-api-cost-settings.ts
```

## 📋 実行内容

### Step 1: データベースマイグレーション

以下のテーブルが作成されます：

1. **api_usage** - API呼び出し記録テーブル
   - 各API呼び出しを記録
   - エンドポイント、メソッド、成功/失敗、コスト、レート制限情報を保存

2. **api_cost_settings** - コスト設定テーブル
   - 月間コスト上限
   - アラート閾値
   - アラートメールアドレス
   - 自動停止設定

### Step 2: コスト設定の初期化

以下の設定が適用されます：

- ✅ 月間コスト上限: **$10.00**
- ✅ アラート閾値: **$8.00**（上限の80%）
- ✅ アラートメール: **info@best-trust.biz**
- ✅ 自動停止: **無効**（デフォルト）

## ✅ 実行後の確認

### 1. 管理画面で確認

`/admin/api-usage` にアクセスして以下を確認：

- コスト情報セクションが表示される
- 今月の使用量とコストが表示される
- 設定が正しく反映されている

### 2. API呼び出しテスト

Twitter APIを呼び出す機能を使用して：

- 使用量が記録されるか確認
- コスト計算が正しく動作するか確認

### 3. データベース確認（オプション）

```sql
-- コスト設定を確認
SELECT * FROM api_cost_settings;

-- API使用量を確認
SELECT COUNT(*) as total_usage, SUM(cost) as total_cost 
FROM api_usage 
WHERE month = DATE_FORMAT(NOW(), '%Y-%m');
```

## 🔧 設定変更

### 管理画面から（今後実装予定）

管理画面UIに設定変更機能を追加予定です。

### データベースから直接

```sql
-- コスト上限を $20 に変更
UPDATE api_cost_settings 
SET monthlyLimit = '20.00', 
    alertThreshold = '16.00',
    updatedAt = NOW()
WHERE id = 1;
```

### スクリプトから再実行

`scripts/init-api-cost-settings.ts` を編集して再実行：

```typescript
monthlyLimit: "20.00",  // 変更
alertThreshold: "16.00", // 変更
alertEmail: "new-email@example.com", // 変更
autoStop: 1, // 1: 有効, 0: 無効
```

## ⚠️ 重要な注意事項

### X APIの実際の価格を確認

現在は `$0.01/件`（100件超過分）と仮定していますが、**実際のX APIの従量課金価格を確認して更新してください**。

**ファイル**: `server/db/api-usage-db.ts`
```typescript
const COST_PER_REQUEST = 0.01; // 実際の価格に更新
```

## 🐛 トラブルシューティング

### DATABASE_URLが設定されていない

**エラー**: `DATABASE_URL is not set`

**解決方法**:
1. `.env.local` ファイルに `DATABASE_URL` を設定
2. または環境変数として設定: `export DATABASE_URL='your-url'`

### マイグレーションが失敗する

**エラー**: テーブルが既に存在する

**解決方法**:
1. 既存のテーブルを確認: `SHOW TABLES LIKE 'api_%';`
2. 必要に応じて手動で削除（注意: データが失われます）
3. マイグレーションを再実行

### スクリプトが実行できない

**エラー**: `npx tsx` が見つからない

**解決方法**:
```bash
# 依存関係をインストール
pnpm install
```

## 📚 関連ドキュメント

- [APIコスト管理ガイド](./docs/API_COST_MANAGEMENT.md)
- [セットアップ完了ガイド](./docs/API_COST_SETUP_COMPLETE.md)

## ✅ チェックリスト

- [ ] データベースマイグレーション実行
- [ ] コスト設定の初期化スクリプト実行
- [ ] 管理画面で設定確認
- [ ] API呼び出しテスト
- [ ] 使用量記録の確認
- [ ] コスト計算の確認
- [ ] X APIの実際の価格を確認・更新
