# ドキュメント目次 (Documentation Index)

**最終更新**: 2026-01-30
**バージョン**: v6.168

このドキュメントは、すべてのドキュメントの目次です。必要な情報を素早く見つけられます。

---

## 📋 プロジェクト管理

### [status.md](./status.md) - プロジェクト状態管理 ⭐

**最重要**: AIと人間の両方がこのドキュメントを参照することで、作業の重複を防ぎ、現在の状態を正確に把握できます。

**内容**:
- 環境変数の設定状況（Sentry、UptimeRobot）
- 外部サービスの設定状況（UptimeRobot、Sentry）
- データベースの状態（hostProfileImageの有無）
- 実装済み機能（認証、画像表示、お気に入り、ホーム画面、マイページ、Gate 1）
- 未解決の問題（サムネイル画像の表示問題）
- 次のアクション

### [checklist.md](./checklist.md) - 統合チェックリスト ⭐

**最重要**: すべてのチェック項目を統合したものです。プロジェクトの完成度を一目で確認できます。

**内容**:
- 認証機能（8/8完了）
- 画像表示（4/6完了）
- お気に入り機能（8/8完了）
- ホーム画面（9/9完了）
- マイページ（7/7完了）
- UI/UX（6/6完了）
- Gate 1（11/11完了）
- 視認性の問題（3/4完了）
- 環境変数の設定（4/4完了）
- 外部サービスの設定（4/4完了）
- データベースの確認（0/3完了）
- 完了率: 51/57 (89%)

---

## 🔧 セットアップ

### [setup-instructions-20260130.md](./setup-instructions-20260130.md) - 環境変数設定とUptimeRobot設定の手順書

**内容**:
- Sentryの有効化手順
- UptimeRobotの監視設定手順
- サムネイル画像の表示確認手順

---

## 🏗️ アーキテクチャ

### [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計書

**内容**:
- システム全体のアーキテクチャ
- フロントエンド（Next.js、TypeScript、Tailwind CSS）
- バックエンド（tRPC、Drizzle ORM、PostgreSQL）
- 認証（Twitter OAuth 2.0）
- デプロイ（Vercel）

---

## 📚 開発ガイド

### [development-guide.md](./development-guide.md) - 開発環境のセットアップガイド

**内容**:
- 開発環境のセットアップ手順
- ローカル開発サーバーの起動方法
- データベースのマイグレーション方法
- テストの実行方法

---

## 🚀 デプロイ

### [gate1.md](./gate1.md) - Gate 1（壊れない／戻せる）

**内容**:
- diff-check（危険ファイル検知）
- デプロイ後検証（`/api/health`、`commitSha`）
- 監視ツール（UptimeRobot、Sentry）

---

## 🐛 問題分析

### [problem-analysis-20260130.md](./problem-analysis-20260130.md) - 問題分析と改善策の提案

**内容**:
- 「何回もやった作業をやらせる」「どこかなおしたらどこか崩れる」という問題の根本原因
- 改善策（status.md、checklist.md、test-all.sh、README.md）

### [visibility-issues.md](./visibility-issues.md) - 視認性の問題

**内容**:
- イベント詳細画面の視認性問題（修正済み）
- コントラスト比の確認結果（WCAG 2.1基準）

---

## 🔍 調査結果

### [investigation-summary-20260130.md](./investigation-summary-20260130.md) - 調査結果のサマリー

**内容**:
- カスタムログイン画面（クッションページ）の実装状況
- サムネイル画像の表示問題の調査結果
- 視認性の問題の確認結果
- UptimeRobotの監視設定の確認結果

### [md-full-audit-20260130-v2.md](./md-full-audit-20260130-v2.md) - md全体監査結果

**内容**:
- すべてのmdファイル（96ファイル）の監査結果
- critical-features-checklist.mdの要件の実装状況
- 環境変数の設定が必要な項目
- 本番環境での確認が必要な項目

---

## 📝 作業ログ

### [chatlog-20260130.md](./chatlog-20260130.md) - 今回のセッションの作業ログ

**内容**:
- 2026-01-30のセッションで実施した作業の記録
- ドキュメント整理（README.md、development-guide.md、architecture.md）
- md未実装項目の洗い出し
- ホーム画面にログインボタンを追加

---

## 🎯 機能仕様

### [critical-features-checklist.md](./critical-features-checklist.md) - 重要機能チェックリスト

**内容**:
- 認証機能の仕様
- 画像表示の仕様
- お気に入り機能の仕様
- ホーム画面の仕様
- マイページの仕様
- UI/UXの仕様

---

## 📖 その他のドキュメント

プロジェクトには、上記以外にも多数のドキュメントがあります。詳細は`docs/`ディレクトリを参照してください。

---

## 🔄 更新履歴

| 日付 | バージョン | 更新内容 |
|------|-----------|---------|
| 2026-01-30 | v6.168 | 初版作成（status.md、checklist.md、README.md） |
