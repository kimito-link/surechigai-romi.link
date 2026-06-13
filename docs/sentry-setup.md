# Sentry 設定ガイド

このドキュメントは、Sentryを使用してエラートラッキングと監視を設定する手順をまとめたものです。

## 目的

- ログイン失敗の急増を検知
- 5xxエラー（サーバーエラー）を検知
- "unknown version"の検知（環境変数の問題）

---

## 設定手順

### 1. Sentryアカウントの作成

1. [Sentry](https://sentry.io/)にアクセス
2. 「Get Started」をクリックして無料アカウントを作成
3. メールアドレスを確認してログイン

### 2. プロジェクトの作成

1. ダッシュボードで「Create Project」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Platform | Next.js |
| Project Name | doin-challenge |
| Alert Frequency | On every new issue |

3. 「Create Project」をクリック

### 3. DSNの取得

プロジェクト作成後、DSN（Data Source Name）が表示されます。これをコピーしてください。

例：
```
https://examplePublicKey@o0.ingest.sentry.io/0
```

### 4. 環境変数の設定

#### Vercel

1. Vercelダッシュボードで「Settings」→「Environment Variables」に移動
2. 以下の環境変数を追加：

| Key | Value | Environment |
|-----|-------|-------------|
| `SENTRY_DSN` | コピーしたDSN | Production, Preview, Development |
| `NEXT_PUBLIC_SENTRY_DSN` | コピーしたDSN | Production, Preview, Development |

3. 「Save」をクリック
4. 「Deployments」タブで最新のデプロイを「Redeploy」

#### Railway

1. Railwayダッシュボードで「Variables」タブに移動
2. 以下の環境変数を追加：

| Key | Value |
|-----|-------|
| `SENTRY_DSN` | コピーしたDSN |
| `NEXT_PUBLIC_SENTRY_DSN` | コピーしたDSN |

3. 自動的に再デプロイされます

---

## アラート設定

### 1. ログイン失敗の急増を検知

1. Sentryダッシュボードで「Alerts」→「Create Alert」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Alert Name | Login Failure Spike |
| When | An event is captured |
| Conditions | `message` contains "login" AND `level` equals "error" |
| Then | Send a notification to |
| Notification | Email / Slack |
| Frequency | On every new issue |

3. 「Save Rule」をクリック

### 2. 5xxエラーを検知

1. Sentryダッシュボードで「Alerts」→「Create Alert」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Alert Name | 5xx Server Errors |
| When | An event is captured |
| Conditions | `http.status_code` is greater than or equal to 500 |
| Then | Send a notification to |
| Notification | Email / Slack |
| Frequency | On every new issue |

3. 「Save Rule」をクリック

### 3. "unknown version"を検知

1. Sentryダッシュボードで「Alerts」→「Create Alert」をクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| Alert Name | Unknown Version Detected |
| When | An event is captured |
| Conditions | `message` contains "unknown" OR `tags.version` equals "unknown" |
| Then | Send a notification to |
| Notification | Email / Slack |
| Frequency | On every new issue |

3. 「Save Rule」をクリック

---

## テスト

### 1. エラーを手動で送信

以下のコードを一時的に追加して、Sentryが正しく動作しているか確認します：

```typescript
// app/test-sentry/page.tsx
"use client";

import * as Sentry from "@sentry/nextjs";

export default function TestSentryPage() {
  const testError = () => {
    Sentry.captureException(new Error("Test error from Sentry"));
    alert("Test error sent to Sentry!");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <button
        onClick={testError}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send Test Error to Sentry
      </button>
    </div>
  );
}
```

### 2. 確認

1. ブラウザで`/test-sentry`にアクセス
2. 「Send Test Error to Sentry」ボタンをクリック
3. Sentryダッシュボードで「Issues」タブを確認
4. 「Test error from Sentry」というエラーが表示されればOK

---

## 実装済みの機能

### 1. クライアント側のエラートラッキング

`sentry.client.config.ts`で以下を設定：

- セッションリプレイ（エラー発生時のみ）
- ネットワークエラーのフィルタリング
- デバッグモード無効化

### 2. サーバー側のエラートラッキング

`sentry.server.config.ts`で以下を設定：

- サーバーエラーのトラッキング
- 404エラーのフィルタリング
- ネットワークエラーのフィルタリング

### 3. Edge Runtimeのエラートラッキング

`sentry.edge.config.ts`で以下を設定：

- Edge Functionのエラートラッキング

---

## トラブルシューティング

### Q: エラーがSentryに送信されない

**A:** 以下を確認してください：

1. 環境変数`SENTRY_DSN`と`NEXT_PUBLIC_SENTRY_DSN`が正しく設定されているか
2. Vercel/Railwayで再デプロイを実行したか
3. ブラウザのコンソールにエラーが表示されているか

### Q: 通知が来ない

**A:** 以下を確認してください：

1. アラートルールが正しく設定されているか
2. 通知先（Email/Slack）が正しく設定されているか
3. Sentryダッシュボードの「Alerts」→「Alert Rules」で、ルールが有効になっているか

---

## 次のステップ

1. ✅ Sentryの設定完了
2. ⬜ 統計ダッシュボードの実装

---

## 参考リンク

- [Sentry公式ドキュメント](https://docs.sentry.io/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Alerts](https://docs.sentry.io/product/alerts/)
