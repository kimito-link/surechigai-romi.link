# X API コスト管理機能の改善 - 設計書

## 設計方針

### 1. キャッシュ期間の調整

#### 実装方法
- `server/twitter-oauth2.ts`の`FOLLOW_STATUS_CACHE_TTL_MS`を48時間に変更
- 環境変数`FOLLOW_STATUS_CACHE_TTL_HOURS`で設定可能にする（デフォルト: 48）

```typescript
const FOLLOW_STATUS_CACHE_TTL_HOURS = parseInt(
  process.env.FOLLOW_STATUS_CACHE_TTL_HOURS || "48",
  10
);
const FOLLOW_STATUS_CACHE_TTL_MS = FOLLOW_STATUS_CACHE_TTL_HOURS * 60 * 60 * 1000;
```

### 2. エンドポイント別コスト表示

#### 実装方法
- `getDashboardSummary`関数にエンドポイント別コスト情報を追加
- 管理画面UIにコスト列を追加

#### データ構造
```typescript
interface EndpointCostStats {
  endpoint: string;
  count: number;
  cost: number;
}
```

### 3. 日次レポート機能

#### 実装方法
- `server/_core/cron.ts`に日次レポート関数を追加
- Vercel Cron JobsまたはGitHub Actionsでスケジュール実行
- `server/api-daily-report.ts`を新規作成

#### レポート内容
- 前日のAPI呼び出し回数
- 前日のコスト
- 今月の累計使用量とコスト
- エンドポイント別の使用量トップ5

#### 通知方法
- `notifyOwner`（Manus Notification Service）経由
- Webhook（`COST_ALERT_WEBHOOK_URL`）経由

## 変更ファイル

### 新規作成
1. `server/api-daily-report.ts` - 日次レポート生成・送信
2. `docs/refactoring/api-cost-improvements/REQUIREMENTS.md`
3. `docs/refactoring/api-cost-improvements/DESIGN.md`
4. `docs/refactoring/api-cost-improvements/TASKS.md`

### 変更
1. `server/twitter-oauth2.ts` - キャッシュ期間を48時間に延長
2. `server/api-usage-tracker.ts` - `getDashboardSummary`にエンドポイント別コストを追加
3. `app/admin/api-usage.tsx` - エンドポイント別コストを表示
4. `server/_core/cron.ts` - 日次レポート関数を追加

## 実装順序

1. キャッシュ期間の調整（最も簡単）
2. エンドポイント別コスト表示（既存機能の拡張）
3. 日次レポート機能（新規機能）
