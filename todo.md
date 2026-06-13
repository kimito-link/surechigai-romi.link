# Birthday Celebration App TODO

## 🔴 Critical（未完了・要対応）

### サムネイル表示
- [ ] チャレンジのサムネイル画像が表示されない場合の調査・修正（**別issue推奨**・FINAL_SETUP_STEPS スコープ外参照）

### ログイン・動作確認
- [ ] ログイン機能の状態確認（反応しない場合は原因調査・修正）
- [x] チャレンジ画面のログインボタン表示（AppHeader に showLoginButton={true} を追加・LoginModal に統一済み）
- [x] 既存の不要ログインUI（LoginConfirmModal は未使用・auth-ux で @deprecated 済み）

### 本番環境での動作確認
- [ ] お気に入り機能（⭐表示・登録解除・マイページ「気になるイベント」）
- [ ] フィルター（すべて/ソロ/グループ/お気に入りタブ）
- [ ] 検索（リアルタイム絞り込み・0件表示）
- [ ] マイページ（プロフィール・バッジ・参加/主催チャレンジ・ログアウト）
- [ ] 実機での視認性確認（必要に応じてユーザー確認依頼）

---

## スコープ外・手動設定（FINAL_SETUP_STEPS 参照）

- **UptimeRobot**: `/api/health` 監視は手動設定（docs/gate1.md 等）
- **Sentry**: 環境変数 `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` は手動設定（docs/sentry-setup.md）

---

## デプロイ・テスト（必要に応じて）

- [ ] workflow-diff-check.md: デプロイ前差分チェック
- [ ] critical-features-checklist.md: 本番環境機能テスト
- [ ] チェックポイント保存・GitHub push・デプロイ（作業完了時）

---

## md・監視・その他

### md全体監視
- [ ] check-all-md.sh の実装
- [ ] 未実装項目の自動検出
- [ ] GitHub Actions への統合・デプロイ前チェック

### Deployment Pipeline（必要なら調査）
- [ ] webdev_save_checkpoint が GitHub に同期されない原因調査
- [ ] Vercel 直接デプロイの検討

---

## オプション・別プロジェクト

### AI × E2E（一旦保留）
- [ ] Sentry AI Autofix / Cloudflare / Slack 通知
- [ ] Autify または mabl トライアル
- [ ] ダッシュボード・メトリクス・アラート

### GitHub 配布（別リポジトリ: ai-implementation-mistake-prevention-system）
- [ ] リポジトリ作成・README・LICENSE
- [ ] テンプレートアップロード・Release v1.0.0・X配布

### LoginModal 追加機能
- [ ] キャラクターとメッセージの対応設計（残り）
- [ ] A/Bテスト結果表示用管理画面
- [ ] 表情とメッセージ連動・ウェルカム拡張（任意）

### TDD・設計
- [ ] docs/REQUIREMENTS.md・DESIGN.md・PROGRESS.md
- [ ] Twitter OAuth profileImage 保存のテストケース

### 視認性（実機確認）
- [ ] チャレンジ詳細「開催中！」ボタン・達成状況セクション
- [ ] マイページ（ヘッダー・統計・ログインボタン・ログアウト）
- [ ] 参加表明画面（ヘッダー・参加者情報・都道府県・性別）

---

## 完了済み（参照用）

- オンボーディング・視認性・ログインOAuth・統計ダッシュボード・表記統一・レスポンシブ
- バージョン表示統一（shared/version.ts）・マイページキャラ表示（ログイン後はTwitter画像で正）
- ログインUI統一（LoginModal）・Sentry導入・動的require()修正・TypeScriptエラー解消
- 性別色分け（UserProfileHeader・ChallengeCard・参加者一覧）・パフォーマンス最適化・PWAインストールプロンプト
- **参加表明日時の記録と表示（案2）**: マイページ・イベント詳細・ランキングに参加日表示

過去の詳細な作業ログ（Vercelデプロイエラー・複数回のTypeScript修正・バージョン管理セクション等）は削除し、上記に集約しています。
