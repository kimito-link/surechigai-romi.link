# ドキュメント一覧

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**バージョン**: 6.181  
**最終更新**: 2026年2月2日

---

## 概要

本ドキュメントは「動員チャレンジ」プロジェクトのすべてのドキュメントを一覧化したものです。目的に応じて適切なドキュメントを参照してください。

---

## 主要ドキュメント

プロジェクトの全体像を理解するための必読ドキュメントです。

| ドキュメント | 説明 | 対象読者 |
|-------------|------|---------|
| [README.md](../README.md) | プロジェクト概要、技術スタック、セットアップ手順 | 全員 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システムアーキテクチャ、データフロー、API設計 | 開発者、アーキテクト |
| [DEPLOY.md](./DEPLOY.md) | デプロイ環境、CI/CD、環境変数（主参照） | DevOps、インフラエンジニア |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | よくある問題と解決方法 | 開発者、運用担当者 |
| [ADAPTATION-GUIDE.md](./ADAPTATION-GUIDE.md) | 他コンセプトへの適用方法 | 開発者、プロダクトマネージャー |

---

## 開発ガイド

開発を進める際に参照するドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | 開発環境のセットアップ、開発フロー |
| [component-guidelines.md](./component-guidelines.md) | コンポーネント設計のガイドライン |
| [performance-best-practices.md](./performance-best-practices.md) | パフォーマンス最適化のベストプラクティス |
| [github-workflow-quality-guide.md](./github-workflow-quality-guide.md) | GitHub Workflowの品質ガイド |
| [e2e-testing.md](./e2e-testing.md) | E2Eテストの実装方法 |

---

## デプロイ・インフラ

デプロイとインフラに関するドキュメントです。**主参照**: [DEPLOY.md](./DEPLOY.md)

| ドキュメント | 説明 |
|-------------|------|
| [deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md) | デプロイ環境詳細 |
| [deploy/RAILWAY_DEPLOY_SETUP.md](./deploy/RAILWAY_DEPLOY_SETUP.md) | Railwayへのデプロイ設定 |
| [CI-CD-WORKFLOW.md](./CI-CD-WORKFLOW.md) | CI/CDワークフローの詳細 |
| [sentry-integration-guide.md](./sentry-integration-guide.md) | Sentryエラー監視の統合 |

---

## UI/UX設計

UI/UX設計に関するドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [UI-FLOW.md](./UI-FLOW.md) | 画面遷移とユーザーフロー |
| [USER-GUIDE.md](./USER-GUIDE.md) | ユーザー向け使い方ガイド |
| [home-ui-redesign-proposal.md](./home-ui-redesign-proposal.md) | ホーム画面のリデザイン提案 |
| [participation-completion-design.md](./participation-completion-design.md) | 参加完了画面のデザイン |
| [accessibility-audit-v4.7.4.md](./accessibility-audit-v4.7.4.md) | アクセシビリティ監査レポート |

---

## プロジェクト管理

プロジェクト管理に関するドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [project-summary.md](./project-summary.md) | プロジェクトサマリー |
| [critical-features-checklist.md](./critical-features-checklist.md) | 重要機能のチェックリスト |
| [project-ng-list.md](./project-ng-list.md) | プロジェクトのNG項目リスト |
| [manual-check.md](./manual-check.md) | 手動チェック項目 |

---

## パフォーマンス・最適化

パフォーマンス最適化に関するドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [PERFORMANCE-OPTIMIZATION.md](./PERFORMANCE-OPTIMIZATION.md) | パフォーマンス最適化レポート |
| [performance-monitoring.md](./performance-monitoring.md) | パフォーマンス監視の設定 |
| [performance-monitoring-auto.md](./performance-monitoring-auto.md) | 自動パフォーマンス監視 |
| [loading-state-analysis.md](./loading-state-analysis.md) | ローディング状態の分析 |

---

## コンサルテーション記録

外部コンサルテーション（ChatGPT）の記録です。

| ドキュメント | 説明 |
|-------------|------|
| [gpt-consultation.md](./gpt-consultation.md) | GPTコンサルテーション記録（v1） |
| [gpt-consultation-v2.md](./gpt-consultation-v2.md) | GPTコンサルテーション記録（v2） |
| [gpt-consultation-v3.md](./gpt-consultation-v3.md) | GPTコンサルテーション記録（v3） |
| [chatgpt-consultation-genres-and-philosophy.md](./chatgpt-consultation-genres-and-philosophy.md) | ジャンルと哲学に関するコンサルテーション |
| [chatgpt-consultation-category-simplification.md](./chatgpt-consultation-category-simplification.md) | カテゴリー簡素化に関するコンサルテーション |

---

## 改善提案・レビュー

改善提案とレビューに関するドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [IMPROVEMENT-REPORT.md](./IMPROVEMENT-REPORT.md) | 改善レポート |
| [next-steps-proposal.md](./next-steps-proposal.md) | 次のステップの提案 |
| [refactoring-next-steps.md](./refactoring-next-steps.md) | リファクタリングの次のステップ |
| [wording-audit-results.md](./wording-audit-results.md) | ワーディング監査結果 |
| [wording-changes-v6.54.md](./wording-changes-v6.54.md) | ワーディング変更（v6.54） |

---

## その他

その他のドキュメントです。

| ドキュメント | 説明 |
|-------------|------|
| [code-reference.md](./code-reference.md) | コードリファレンス |
| [language-policy.md](./language-policy.md) | 言語ポリシー |
| [color-token-proposal.md](./color-token-proposal.md) | カラートークン提案 |
| [infinite-scroll-guide.md](./infinite-scroll-guide.md) | 無限スクロールガイド |
| [copilot-cli-setup.md](./copilot-cli-setup.md) | Copilot CLIセットアップ |

---

## ドキュメントの更新

ドキュメントを更新する際は、以下のルールに従ってください：

1. **バージョン番号の更新**: ドキュメントのヘッダーでバージョン番号を更新
2. **最終更新日の更新**: ドキュメントのヘッダーで最終更新日を更新
3. **変更履歴の記録**: 大きな変更の場合は、ドキュメント末尾に変更履歴を追加
4. **INDEX.mdの更新**: 新しいドキュメントを追加した場合は、本ファイルを更新

---

## 貢献

ドキュメントの改善提案やバグ報告は、GitHubのIssueで受け付けています。

---

## ライセンス

本プロジェクトのドキュメントは、MITライセンスの下で公開されています。
