# X API コスト管理機能の改善 - タスクリスト

## Phase 1: キャッシュ期間の調整
- [x] `server/twitter-oauth2.ts` - キャッシュ期間を48時間に延長
- [x] 環境変数`FOLLOW_STATUS_CACHE_TTL_HOURS`で設定可能にする
- [x] 動作確認

## Phase 2: エンドポイント別コスト表示
- [x] `server/api-usage-tracker.ts` - `getDashboardSummary`にエンドポイント別コストを追加
- [x] `app/admin/api-usage.tsx` - エンドポイント別コストを表示
- [x] UIの動作確認

## Phase 3: 日次レポート機能
- [x] `server/api-daily-report.ts` - 日次レポート生成・送信関数を作成
- [x] `server/_core/cron.ts` - 日次レポート関数を追加
- [x] Vercel Cron JobsまたはGitHub Actionsの設定
- [x] 動作確認

## Phase 4: ドキュメント更新
- [x] `docs/API_COST_MANAGEMENT.md`を更新
- [x] 作業履歴を`docs/refactoring/PROGRESS.md`に記録
