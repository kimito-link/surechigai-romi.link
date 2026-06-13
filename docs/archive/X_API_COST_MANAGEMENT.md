# X API（旧Twitter API）コスト管理機能 - 実装完了レポート

**最終更新**: 2026年1月31日

## 概要

X APIの従量課金設定に対応し、API使用量とコストを管理する機能が実装済みです。

---

## 実装済み機能

### 1. API呼び出し回数の監視 ✅

#### データベース記録

- **テーブル**: `api_usage`
- **記録内容**:
  - エンドポイント名（例: `/2/users/by/username/:username`）
  - HTTPメソッド（GET, POST等）
  - 成功/失敗フラグ
  - レート制限情報（limit, remaining, reset）
  - コスト（無料枠超過分のみ）
  - 月（YYYY-MM形式）

#### 自動記録

- **場所**: `server/rate-limit-handler.ts` の `twitterApiFetch` 関数
- **動作**: すべてのX API呼び出しを自動的に記録
- **非同期処理**: API呼び出しのパフォーマンスに影響しない

#### 実装ファイル

- `server/db/api-usage-db.ts` - データベース操作
- `server/api-usage-tracker.ts` - メモリ内統計（リアルタイム表示用）
- `drizzle/schema/api-usage.ts` - データベーススキーマ

---

### 2. コスト上限アラート ✅

#### 設定項目

- **月間コスト上限**: デフォルト $10.00（管理画面で変更可能）
- **アラート閾値**: デフォルト $8.00（上限に近づいたら警告）
- **アラート送信先メール**: 任意設定（例: `info@best-trust.biz`）
- **自動停止**: 上限到達時にAPI呼び出しを自動停止（ON/OFF可能）

#### アラート送信方法

1. **Manus Notification Service（Forge）**
   - 自動的に通知を送信
   - 配信先は Forge 側で設定（例: `info@best-trust.biz`）

2. **Webhook（任意）**
   - 環境変数 `COST_ALERT_WEBHOOK_URL` を設定すると、Zapier/Make 等でメール転送可能
   - ペイロード: `{ title, content, alertEmail, exceeded, currentCost, limit }`

#### 自動停止機能

- コスト上限を超過し、`autoStop` が有効な場合、すべてのX API呼び出しを自動停止
- エラーメッセージ: "API呼び出しはコスト上限により停止されています。管理画面で設定を確認してください。"

#### 実装ファイル

- `server/api-cost-alert.ts` - アラート送信ロジック
- `server/db/api-usage-db.ts` - コスト設定の保存・取得

---

### 3. キャッシュの最適化 ✅

#### フォロー状態のキャッシュ

- **期間**: **24時間**（2026年1月31日更新: 48時間→24時間に最適化）
- **場所**: `server/twitter-oauth2.ts`
- **設定**: 環境変数 `FOLLOW_STATUS_CACHE_TTL_HOURS` で変更可能（デフォルト: 24時間）
- **効果**: 同一ユーザーのフォロー状態チェックを24時間以内はAPI呼び出しなし

```typescript
// フォロー状態のサーバー側キャッシュ（24時間 TTL、環境変数で設定可能）
const FOLLOW_STATUS_CACHE_TTL_HOURS = parseInt(
  process.env.FOLLOW_STATUS_CACHE_TTL_HOURS || "24",
  10
);
```

#### プロフィール情報のキャッシュ

- **期間**: 1時間
- **場所**: `lib/api/profile-cache.ts`
- **実装**: 
  - メモリキャッシュ（高速アクセス）
  - AsyncStorage（永続化）
- **効果**: プロフィール情報取得のAPI呼び出しを削減

---

## 管理画面

### URL

`/admin/api-usage`

### 表示内容

1. **今月のコスト**
   - 使用量（件数）
   - 無料枠残り（100件まで無料）
   - 推定コスト（$0.01/件 × 超過分）
   - コスト上限との比較

2. **コスト設定**
   - 月間コスト上限（USD）
   - アラート閾値（USD）
   - アラート送信先メール
   - 自動停止のON/OFF

3. **エンドポイント別統計**
   - 今月の累計リクエスト数
   - エンドポイント別コスト
   - レート制限状況

4. **警告表示**
   - コスト上限超過時: 赤色で警告表示
   - アラート閾値到達時: 黄色で警告表示

### 実装ファイル

- `app/admin/api-usage.tsx` - 管理画面UI
- `server/_core/index.ts` - APIエンドポイント `/api/admin/api-usage`
- `server/routers/admin.ts` - tRPCルーター（コスト設定の取得・更新）

---

## コスト計算ロジック

### 無料枠

- **月100件まで**: 無料
- **100件超過分**: $0.01/件

### 計算式

```typescript
const FREE_TIER_LIMIT = 100; // 月100件まで無料
const COST_PER_REQUEST = 0.01; // 100件超過分のUSD/件

const monthlyUsage = await getMonthlyUsage(month);
const isFreeTier = monthlyUsage < FREE_TIER_LIMIT;
const cost = isFreeTier ? 0 : COST_PER_REQUEST;
```

---

## 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `FOLLOW_STATUS_CACHE_TTL_HOURS` | フォロー状態のキャッシュ期間（時間） | `24` |
| `COST_ALERT_WEBHOOK_URL` | コストアラート送信先Webhook URL（任意） | - |

---

## 使用例

### コスト設定の更新

```typescript
// tRPC経由で設定を更新
await trpc.admin.updateApiCostSettings.mutate({
  monthlyLimit: 10.0,      // $10.00
  alertThreshold: 8.0,      // $8.00
  alertEmail: "info@best-trust.biz",
  autoStop: true,           // 上限到達時に自動停止
});
```

### API使用量の取得

```typescript
// 今月の統計を取得
const stats = await getCurrentMonthStats();
console.log({
  usage: stats.usage,                    // 使用量（件数）
  cost: stats.cost,                      // コスト（USD）
  freeTierRemaining: stats.freeTierRemaining, // 無料枠残り
});
```

---

## 改善履歴

### 2026年1月31日

- ✅ フォロー状態のキャッシュ期間を48時間→24時間に最適化
- ✅ コメントと実装の不一致を修正（「24時間」と書いてあったが実際は48時間だった）

---

## 参考資料

- [X API Pricing](https://developer.twitter.com/en/products/twitter-api) - 公式料金表
- `docs/API_COST_MANAGEMENT_STATUS.md` - 実装状況の詳細
