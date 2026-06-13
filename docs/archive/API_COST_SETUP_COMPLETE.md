# APIコスト管理セットアップ完了ガイド

## ✅ 実装完了内容

### 1. データベーススキーマ
- ✅ `api_usage` テーブル作成
- ✅ `api_cost_settings` テーブル作成
- ✅ マイグレーションファイル作成: `drizzle/0027_api_usage_tracking.sql`

### 2. 機能実装
- ✅ API呼び出し回数の自動記録
- ✅ コスト計算機能（月100件まで無料、超過分は $0.01/件）
- ✅ コスト上限アラート機能
- ✅ 管理画面でのコスト表示
- ✅ フォロー状態のキャッシュ最適化（24時間）

### 3. 設定
- ✅ コスト上限: $10.00
- ✅ アラート閾値: $8.00（上限の80%）
- ✅ アラートメール: info@best-trust.biz
- ✅ 自動停止: 有効（デフォルト）

## 📋 実行が必要な作業

### Step 1: データベースマイグレーションの実行

**本番環境（Railway/Vercel等）で実行:**

```bash
# マイグレーションを実行
pnpm drizzle-kit migrate
```

または、デプロイ時に自動実行される場合は、そのままデプロイしてください。

**ローカル環境で実行:**

```bash
# .env.localにDATABASE_URLを設定してから
pnpm drizzle-kit migrate
```

### Step 2: コスト設定の初期化

**本番環境で実行:**

```bash
npx tsx scripts/init-api-cost-settings.ts
```

これにより以下が設定されます：
- 月間コスト上限: $10.00
- アラート閾値: $8.00
- アラートメール: info@best-trust.biz
- 自動停止: 有効

**注意**: このスクリプトは既存の設定がある場合は更新し、ない場合は新規作成します。

### Step 3: 動作確認

1. **管理画面で確認**
   - `/admin/api-usage` にアクセス
   - コスト情報が表示されるか確認

2. **API呼び出しテスト**
   - Twitter APIを呼び出す機能を使用
   - 使用量が記録されるか確認

3. **コスト計算の確認**
   - 100件以下: コスト $0.00
   - 100件超過: 超過分 × $0.01

## 🔧 設定変更方法

### 管理画面から変更（推奨）

今後、管理画面UIに設定変更機能を追加する予定です。

### データベースから直接変更

```sql
-- コスト上限を変更
UPDATE api_cost_settings 
SET monthlyLimit = '20.00', 
    alertThreshold = '16.00',
    updatedAt = NOW()
WHERE id = 1;

-- アラートメールを変更
UPDATE api_cost_settings 
SET alertEmail = 'new-email@example.com',
    updatedAt = NOW()
WHERE id = 1;

-- 自動停止を有効化
UPDATE api_cost_settings 
SET autoStop = 1,
    updatedAt = NOW()
WHERE id = 1;
```

### スクリプトから変更

`scripts/init-api-cost-settings.ts` を編集して再実行：

```typescript
monthlyLimit: "20.00",  // 変更
alertThreshold: "16.00", // 変更
alertEmail: "new-email@example.com", // 変更
autoStop: 1, // 1: 有効, 0: 無効
```

## 📊 監視方法

### 管理画面
- `/admin/api-usage` でリアルタイムの使用量とコストを確認

### アラート通知
- コストが $8.00 に達すると `notifyOwner` 経由で通知
- コストが $10.00 に達すると超過アラートが送信
- 自動停止が有効な場合、API呼び出しが停止

## ⚠️ 重要な注意事項

### X APIの実際の価格を確認（COST_PER_REQUEST 更新手順）

現在は `$0.01/件`（100件超過分）と仮定していますが、**実際のX APIの従量課金価格を確認して更新してください**。

**更新手順:**
1. `server/db/api-usage-db.ts` を開く
2. `COST_PER_REQUEST` を検索する
3. 公式の単価（USD/件）に書き換え、保存する

```typescript
const COST_PER_REQUEST = 0.01; // 要確認: X API公式の従量課金単価に更新
```

### コスト計算の仕組み

1. **無料枠**: 月100件まで無料
2. **超過分**: 100件を超えた分は課金
3. **計算式**: `cost = max(0, (usage - 100)) * COST_PER_REQUEST`

## 🐛 トラブルシューティング

### マイグレーションが失敗する

1. データベース接続を確認
2. 既存のテーブルと競合していないか確認
3. マイグレーションファイルの構文を確認

### 使用量が記録されない

1. `twitterApiFetch` が正しく呼び出されているか確認
2. データベース接続を確認
3. サーバーログでエラーを確認

### アラートが届かない

1. `BUILT_IN_FORGE_API_URL` と `BUILT_IN_FORGE_API_KEY` が設定されているか確認
2. `notifyOwner` 関数が正しく動作しているか確認
3. サーバーログでエラーを確認

## 📝 関連ファイル

- `drizzle/schema/api-usage.ts` - スキーマ定義
- `drizzle/0027_api_usage_tracking.sql` - マイグレーションファイル
- `server/db/api-usage-db.ts` - DB操作関数
- `server/api-usage-tracker.ts` - 使用量追跡
- `server/api-cost-alert.ts` - コストアラート
- `server/rate-limit-handler.ts` - API呼び出しラッパー
- `app/admin/api-usage.tsx` - 管理画面UI
- `scripts/init-api-cost-settings.ts` - 初期設定スクリプト

## ✅ チェックリスト

- [ ] データベースマイグレーション実行
- [ ] コスト設定の初期化スクリプト実行
- [ ] 管理画面で設定確認
- [ ] API呼び出しテスト
- [ ] 使用量記録の確認
- [ ] コスト計算の確認
- [ ] X APIの実際の価格を確認・更新
- [ ] アラート通知のテスト（オプション）
