# mdファイル分類結果

**作成日**: 2026-01-29  
**目的**: すべてのmdファイルを「実装対象」「テスト対象」「ドキュメント」に分類

---

## 📋 分類基準

| 分類 | 説明 | 例 |
|------|------|-----|
| **実装対象** | コード実装が必要なタスク | Sentry導入、API実装、UI修正 |
| **テスト対象** | 手動テストが必要なチェックリスト | ログイン動作確認、画面表示確認 |
| **ドキュメント** | ガイドライン・参考資料（実装不要） | アーキテクチャ図、設計思想、使い方 |

---

## 🎯 実装対象（コード実装が必要）

### 1. gate1.md
- **未完了項目**: 2件
  - [ ] UptimeRobotで `/api/health` を監視
  - [ ] Sentry導入（通知は最小3種類だけ）
- **優先度**: 高
- **見積もり**: 1-2時間

### 2. visibility-issues.md
- **未完了項目**: 2件
  - [ ] 修正後のコントラスト比を確認
  - [ ] 実機で視認性を確認
- **優先度**: 中（コード修正は完了済み、確認のみ）
- **見積もり**: 30分

### 3. next-steps-proposal.md
- **内容**: 追加機能の提案（プッシュ通知、リアルタイム更新など）
- **優先度**: 低（ユーザーが明示的に依頼していない）
- **見積もり**: 未定

---

## ✅ テスト対象（手動テストが必要）

### 1. critical-features-checklist.md
- **未完了項目**: 53件
- **内容**: 本番環境での機能テストチェックリスト
  - ログイン機能
  - サムネイル表示
  - お気に入り機能
  - ホーム画面レイアウト
  - マイページレイアウト
  - 統計ダッシュボード
  - 管理画面
  - チャレンジ作成
  - 参加機能
  - 地図表示
  - レスポンシブ対応
- **優先度**: 高（本番環境デプロイ後に実施）
- **見積もり**: 2-3時間（手動テスト）

### 2. workflow-diff-check.md
- **未完了項目**: 8件
- **内容**: デプロイ前の差分チェックリスト
- **優先度**: 高（デプロイ前に実施）
- **見積もり**: 30分

---

## 📚 ドキュメント（実装不要）

以下のmdファイルは**ガイドライン・参考資料**であり、実装対象ではありません：

### アーキテクチャ・設計
- ADAPTATION-GUIDE.md（他プロジェクトへの適用ガイド）
- ARCHITECTURE.md（アーキテクチャレビューチェックリスト）
- API-ARCHITECTURE.md（API設計ドキュメント）
- COMPONENT-ARCHITECTURE.md（コンポーネント設計）
- COMPONENT-MAP.md（コンポーネントマップ）
- DATA-FLOW.md（データフロー図）
- UI-FLOW.md（UI遷移図）

### 開発ガイド
- DEVELOPMENT_GUIDE.md（開発ガイド）
- DEPLOY.md（デプロイ手順）
- DEPLOYMENT.md（デプロイ設定）
- DEPLOY_WORKFLOW.md（デプロイワークフロー）
- TROUBLESHOOTING.md（トラブルシューティング）
- performance-best-practices.md（パフォーマンスベストプラクティス）
- component-guidelines.md（コンポーネントガイドライン）

### 品質管理
- github-workflow-quality-guide.md（品質管理ガイド）
- how-to-use-workflow-guide.md（品質管理ガイドの使い方）
- implementation-guide-template.md（実装ガイドテンプレート）
- ng-list-template.md（NG集テンプレート）
- review-checklist-template.md（レビューチェックリストテンプレート）
- project-ng-list.md（プロジェクトNG集）

### 設計思想・相談記録
- DECISION-LOG.md（設計判断ログ）
- chatgpt-consultation-*.md（ChatGPT相談記録）
- gpt-consultation-*.md（GPT相談記録）
- language-policy.md（言語ポリシー）

### 提案・分析
- COLOR_PALETTE_CANDIDATES.md（カラーパレット候補）
- home-ui-redesign-proposal.md（ホーム画面UI再設計提案）
- stats-dashboard-design.md（統計ダッシュボード設計）
- participation-completion-design.md（参加完了設計）
- realtime-concept-enhancement-v6.55.md（リアルタイム概念強化）
- number-label-additions-v6.56.md（数値ラベル追加）

### 監査・レポート
- accessibility-audit-v4.7.4.md（アクセシビリティ監査）
- wording-audit-results.md（文言監査結果）
- wording-changes-v6.54.md（文言変更）
- wording-review-main-screens.md（メイン画面文言レビュー）
- loading-state-analysis.md（ローディング状態分析）
- md-audit-results.md（md監査結果）
- v6.161-summary.md（v6.161サマリー）

### セットアップ・ツール
- sentry-setup.md（Sentryセットアップ）
- sentry-integration-guide.md（Sentry統合ガイド）
- uptime-robot-setup.md（UptimeRobotセットアップ）
- vercel-env-setup.md（Vercel環境変数セットアップ）
- copilot-cli-setup.md（Copilot CLIセットアップ）
- github-copilot-cli-cost-analysis.md（Copilot CLIコスト分析）
- github-copilot-pricing-comparison.md（Copilot価格比較）

### その他
- USER-GUIDE.md（ユーザーガイド）
- INDEX.md（インデックス）
- project-summary.md（プロジェクトサマリー）
- manual-check.md（手動チェック）
- code-reference.md（コード参照）

---

## 📊 サマリー

| 分類 | ファイル数 | 未完了項目数 | 優先度 |
|------|-----------|-------------|--------|
| **実装対象** | 3 | 4 | 高（2件）、中（2件） |
| **テスト対象** | 2 | 61 | 高 |
| **ドキュメント** | 70+ | 300+ | N/A |

---

## 🎯 次のアクション

### Phase 1: 実装対象を完了（優先度順）
1. ✅ gate1.md: UptimeRobot設定（30分）
2. ✅ gate1.md: Sentry導入（1時間）
3. ✅ visibility-issues.md: コントラスト比確認（15分）
4. ✅ visibility-issues.md: 実機確認（15分）

### Phase 2: テスト対象を完了
1. ✅ workflow-diff-check.md: デプロイ前差分チェック（30分）
2. ✅ critical-features-checklist.md: 本番環境機能テスト（2-3時間）

### Phase 3: 品質改善.zipを作成
1. 今回培った手法を技術mdとして文書化
2. スクリプト、ワークフロー、ドキュメントをzipにまとめる

---

## 💡 重要な気づき

**ドキュメントのチェックボックスは「実装タスク」ではなく「レビュー項目」**

例えば、`ARCHITECTURE.md`の以下のチェックボックス：
- [ ] 認証フローは安全か（PKCE、state検証）
- [ ] データベース設計は正規化されているか

これらは「実装する」ものではなく、「レビュー時に確認する」項目です。

**結論**: ドキュメントのチェックボックスは、実装対象ではなく、**品質チェックリスト**として扱うべきです。
