# E2Eテスト ガイド

## 概要

Playwright を使用した管理画面のE2Eテストです。

## 認証方式

E2Eテストでは、Twitter OAuthの実ログインをバイパスするため、`x-e2e-admin: 1` ヘッダーを使用します。

**重要**: このバイパスは開発環境（`E2E_ADMIN_BYPASS=1`）でのみ有効です。本番環境では無効化されています。

## テスト実行

### ローカル実行

```bash
# 開発サーバーを起動（別ターミナル）
pnpm dev

# E2Eテストを実行
pnpm e2e

# UIモードで実行（デバッグ用）
pnpm e2e:ui

# レポートを表示
pnpm e2e:report
```

### CI実行

CIでは `lint-check-test` ジョブの後に `e2e` ジョブが実行されます。

失敗時は以下のアーティファクトが保存されます：
- `playwright-report/` - HTMLレポート
- `test-results/` - スクリーンショット、トレース、ビデオ

## テスト内容

### 自動監視（全テスト共通）

1. **console.error** - 1件でも出たらFAIL
2. **4xx/5xx レスポンス** - 既知の無害なパス以外はFAIL
3. **pageerror** - 未処理例外が出たらFAIL
4. **requestId** - 失敗時にログ出力

### テストケース

| テスト | 内容 |
|--------|------|
| ダッシュボード | `/admin` + 「ダッシュボード」表示 |
| カテゴリ管理 | `/admin/categories` + 「カテゴリ」表示 |
| チャレンジ管理 | `/admin/challenges` + 「チャレンジ」表示 |
| 参加管理 | `/admin/participations` + 「参加」表示 |
| ユーザー管理 | `/admin/users` + 「ユーザー」表示 |
| システム状態 | `/admin/system` + 「システム」表示 |
| API使用量 | `/admin/api-usage` + 「API」表示 |
| エラーログ | `/admin/errors` + 「エラー」表示 |
| データ整合性 | `/admin/data-integrity` + 「整合性」表示 |
| コンポーネントギャラリー | `/admin/component-gallery` + 「コンポーネント」表示 |
| 全ページ一括巡回 | 全10ページが404なしで連続アクセス可能 |

## 許可リスト

以下のエラー/404はテスト失敗としてカウントしません：

### console.error許可パターン
- `favicon.ico` 関連
- `ResizeObserver loop` 警告
- `Expo push token` 警告
- `Require cycles are allowed` 警告

### 404許可パス
- `/favicon.ico`
- `/apple-touch-icon.png`
- `/manifest.json`

## トラブルシューティング

### テストが失敗する場合

1. `test-results/` ディレクトリのスクリーンショットを確認
2. `playwright-report/` のHTMLレポートを確認
3. requestId がログに出力されていれば、監査ログで追跡可能

### 認証エラーの場合

開発環境で `E2E_ADMIN_BYPASS=1` が設定されているか確認してください。
