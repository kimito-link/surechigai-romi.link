# API アーキテクチャ設計書

**最終更新日**: 2025年1月17日  
**バージョン**: v5.32  
**作成者**: Manus AI

---

## 設計思想：生成AI時代のAPI設計

本ドキュメントは「動員ちゃれんじ」アプリケーションにおけるAPI呼び出しの設計と実装ガイドラインを定義します。従来の「人間向け・正規化重視」の設計から、「AI向け・推論効率重視」の設計へとパラダイムシフトした考え方を採用しています。

### パラダイムシフト：評価指標の転換

従来のAPI設計では、コードの重複を避けることや正規化が重視されてきました。しかし、生成AI時代においては「AIが一発で理解できるか？」という指標が重要になります。

| 従来の評価指標 | 新しい評価指標 |
|---------------|---------------|
| コードの重複を避ける | 1ホップで理解できる |
| 正規化・DRY原則 | コンテキストの完全性 |
| ファイル数を減らす | 関心の分離と明確な責務 |

### 1ホップ理解の原則

API関連のコードを理解するために、複数のファイルを辿る必要がある設計は避けます。`lib/api/` ディレクトリを見れば、API呼び出しに関するすべてが把握できる設計を目指します。

```
開発者/AI → lib/api/index.ts → 必要な関数をすべてエクスポート
                ↓
            1ホップで理解 = 速い＆安い
```

---

## システム構成

本アプリケーションは以下の構成で動作しています。フロントエンドとバックエンドが異なるドメインで動作するため、API呼び出し時には明示的にバックエンドURLを指定する必要があります。

| コンポーネント | ホスティング | URL | 役割 |
|---------------|-------------|-----|------|
| フロントエンド | Vercel | `https://doin-challenge.com` | UI表示、ユーザー操作 |
| バックエンドAPI | Railway | `https://doin-challengecom-production.up.railway.app` | 認証、データ処理 |
| データベース | Railway PostgreSQL | 内部接続 | データ永続化 |

---

## ディレクトリ構造：コンテキストドキュメント的アプローチ

API関連のユーティリティは `lib/api/` ディレクトリに集約されています。このディレクトリ自体が「API Context Document」として機能し、API呼び出しに関するすべての情報を1箇所で提供します。

```
lib/
└── api/
    ├── index.ts          # エクスポート集約（エントリーポイント）
    ├── config.ts         # API設定・Base URL取得
    ├── client.ts         # APIクライアント（リトライ、キャッシュ、オフラインサポート）
    ├── endpoints.ts      # 各APIエンドポイントへのアクセス関数
    └── twitter-auth.ts   # Twitter認証URL生成
```

### index.ts：エントリーポイント

`lib/api/index.ts` は、API関連のすべての関数をエクスポートするエントリーポイントです。開発者やAIがAPI関連の機能を使用する際は、このファイルからインポートすることで、必要な関数を1ホップで取得できます。

```tsx
// ✅ 推奨：index.tsからインポート
import { 
  getApiBaseUrl, 
  redirectToTwitterAuth,
  apiGet,
  apiPost,
  lookupTwitterUser,
  getErrorMessage,
  // v5.32で追加
  clearApiCache,
  startNetworkMonitoring,
  getQueueSize,
} from "@/lib/api";

// ❌ 非推奨：個別ファイルから直接インポート
import { getApiBaseUrl } from "@/lib/api/config";
```

---

## APIクライアントモジュール

### lib/api/client.ts

このファイルはfetch呼び出しのラッパーを提供し、エラーハンドリング、ログ機能、リトライ、キャッシュ、オフラインサポートを一元管理します。すべてのAPI呼び出しはこのファイルの関数を通じて行うことで、一貫した動作を保証します。

**主要な関数:**

| 関数名 | 説明 | 用途 |
|--------|------|------|
| `apiRequest<T>(endpoint, options)` | 汎用APIリクエスト関数 | すべてのAPI呼び出しの基盤 |
| `apiGet<T>(endpoint, options)` | GETリクエスト | データ取得 |
| `apiPost<T>(endpoint, options)` | POSTリクエスト | データ送信 |
| `apiPut<T>(endpoint, options)` | PUTリクエスト | データ更新 |
| `apiDelete<T>(endpoint, options)` | DELETEリクエスト | データ削除 |
| `setApiLogging(enabled)` | ログ機能の有効/無効切り替え | デバッグ |
| `getErrorMessage(response)` | ユーザー向けエラーメッセージ取得 | エラー表示 |
| `isApiSuccess<T>(response)` | 成功レスポンスの型ガード | 型安全なデータアクセス |
| `clearApiCache()` | キャッシュをクリア | キャッシュ管理 |
| `startNetworkMonitoring()` | ネットワーク監視を開始 | オフラインサポート |
| `stopNetworkMonitoring()` | ネットワーク監視を停止 | クリーンアップ |
| `getQueueSize()` | オフラインキューのサイズを取得 | 状態確認 |
| `clearQueue()` | オフラインキューをクリア | キュー管理 |

**ApiResponse型:**

```tsx
interface ApiResponse<T = unknown> {
  ok: boolean;        // レスポンスが成功したかどうか
  status: number;     // HTTPステータスコード
  data: T | null;     // レスポンスデータ
  error: string | null; // エラーメッセージ
  fromCache?: boolean; // キャッシュから取得したかどうか
  queued?: boolean;    // オフラインキューに追加されたかどうか
}
```

---

## リトライ機能（v5.32追加）

ネットワークエラーやサーバーエラー時に、指数バックオフ付きで自動リトライを行います。

### リトライ設定

```tsx
interface RetryConfig {
  maxRetries?: number;      // 最大リトライ回数（デフォルト: 3）
  initialDelay?: number;    // 初期遅延（ミリ秒、デフォルト: 1000）
  maxDelay?: number;        // 最大遅延（ミリ秒、デフォルト: 10000）
  backoffFactor?: number;   // バックオフ係数（デフォルト: 2）
  retryableStatuses?: number[]; // リトライ対象ステータス
}
```

### リトライ対象のステータスコード

| ステータス | 説明 | リトライ |
|-----------|------|----------|
| 0 | ネットワークエラー | ✅ |
| 408 | Request Timeout | ✅ |
| 429 | Too Many Requests | ✅ |
| 500 | Internal Server Error | ✅ |
| 502 | Bad Gateway | ✅ |
| 503 | Service Unavailable | ✅ |
| 504 | Gateway Timeout | ✅ |
| その他 | - | ❌ |

### 指数バックオフの計算

リトライ間隔は以下の式で計算されます（ジッター付き）：

```
遅延 = min(initialDelay × backoffFactor^attempt + jitter, maxDelay)
```

例（デフォルト設定）：
- 1回目のリトライ: 約1秒後
- 2回目のリトライ: 約2秒後
- 3回目のリトライ: 約4秒後

### 使用例

```tsx
import { apiGet } from "@/lib/api";

// リトライ付きGETリクエスト
const response = await apiGet<User[]>("/api/users", {
  retry: {
    maxRetries: 5,
    initialDelay: 500,
  },
});
```

---

## キャッシュ機能（v5.32追加）

GETリクエストのレスポンスをメモリとAsyncStorageにキャッシュし、パフォーマンスを向上させます。

### キャッシュ設定

```tsx
interface CacheConfig {
  enabled?: boolean;       // キャッシュを有効にするか（デフォルト: false）
  ttl?: number;            // 有効期限（ミリ秒、デフォルト: 300000 = 5分）
  key?: string;            // カスタムキャッシュキー
  useWhenOffline?: boolean; // オフライン時にキャッシュを使用するか（デフォルト: true）
}
```

### キャッシュの階層構造

```
┌─────────────────────────────────────────────────────────────┐
│                    キャッシュ階層                            │
├─────────────────────────────────────────────────────────────┤
│  1. メモリキャッシュ（Map）                                  │
│     - 最速アクセス                                          │
│     - アプリ再起動で消失                                    │
├─────────────────────────────────────────────────────────────┤
│  2. AsyncStorage                                            │
│     - 永続化                                                │
│     - アプリ再起動後も有効                                  │
├─────────────────────────────────────────────────────────────┤
│  3. ネットワークリクエスト                                  │
│     - 最新データ                                            │
│     - キャッシュ更新                                        │
└─────────────────────────────────────────────────────────────┘
```

### 使用例

```tsx
import { apiGet, clearApiCache } from "@/lib/api";

// キャッシュ付きGETリクエスト
const response = await apiGet<User[]>("/api/users", {
  apiCache: {
    enabled: true,
    ttl: 60000, // 1分間キャッシュ
  },
});

// キャッシュから取得したかどうかを確認
if (response.fromCache) {
  console.log("キャッシュから取得しました");
}

// キャッシュをクリア
await clearApiCache();
```

---

## オフラインサポート（v5.32追加）

ネットワーク切断時にリクエストをキューイングし、復帰後に自動的に再送信します。

### オフラインキューの動作

```
┌─────────────────────────────────────────────────────────────┐
│                    オフライン時の動作                        │
├─────────────────────────────────────────────────────────────┤
│  1. GETリクエスト                                           │
│     - キャッシュがあれば返す                                │
│     - なければエラーを返す                                  │
├─────────────────────────────────────────────────────────────┤
│  2. POST/PUT/DELETEリクエスト（queueWhenOffline: true）     │
│     - AsyncStorageのキューに追加                            │
│     - queued: true を返す                                   │
│     - オンライン復帰時に自動再送信                          │
└─────────────────────────────────────────────────────────────┘
```

### ネットワーク監視の初期化

アプリ起動時に `startNetworkMonitoring()` を呼び出すことで、ネットワーク状態の監視を開始します。オンライン復帰時に自動的にキューを処理します。

```tsx
// app/_layout.tsx
import { startNetworkMonitoring, stopNetworkMonitoring } from "@/lib/api";

useEffect(() => {
  startNetworkMonitoring();
  return () => stopNetworkMonitoring();
}, []);
```

### 使用例

```tsx
import { apiPost, getQueueSize, clearQueue } from "@/lib/api";

// オフライン時にキューイングするPOSTリクエスト
const response = await apiPost("/api/events", {
  body: { name: "新規イベント" },
  queueWhenOffline: true,
});

if (response.queued) {
  console.log("オフラインのためキューに追加されました");
}

// キューのサイズを確認
const queueSize = await getQueueSize();
console.log(`${queueSize}件のリクエストが待機中`);

// キューをクリア（必要に応じて）
await clearQueue();
```

---

## APIエンドポイントモジュール

### lib/api/endpoints.ts

このファイルは各APIエンドポイントへのアクセス関数を提供します。すべてのAPI呼び出しはこのファイルの関数を通じて行います。

**認証関連API:**

| 関数名 | エンドポイント | 説明 |
|--------|---------------|------|
| `clearSession()` | POST /api/auth/clear-session | セッションをクリア |
| `validateSession(token)` | POST /api/auth/session | セッションを検証 |
| `refreshToken(token)` | POST /api/twitter/refresh | トークンをリフレッシュ |

**Twitter関連API:**

| 関数名 | エンドポイント | 説明 |
|--------|---------------|------|
| `lookupTwitterUser(input)` | POST /api/twitter/lookup | Twitterユーザーを検索 |
| `getFollowStatus(userId)` | GET /api/twitter/follow-status | フォローステータスを取得 |

**管理者API:**

| 関数名 | エンドポイント | 説明 |
|--------|---------------|------|
| `getApiUsage()` | GET /api/admin/api-usage | API使用状況を取得 |

---

## API設定モジュール

### lib/api/config.ts

このファイルはAPI Base URLの取得ロジックを一元管理します。環境（開発/本番）に応じて適切なURLを返すことで、環境間の差異によるエラーを防止します。

**主要な関数と定数:**

| 名前 | 種類 | 説明 |
|------|------|------|
| `PRODUCTION_API_URL` | 定数 | Railway本番APIのURL |
| `PRODUCTION_DOMAINS` | 定数 | 本番環境ドメインのリスト |
| `getApiBaseUrl()` | 関数 | 環境に応じたAPI Base URLを取得 |
| `isProductionDomain(hostname)` | 関数 | 本番環境ドメインかどうかを判定 |
| `logApiConfig()` | 関数 | デバッグ用にAPI設定をログ出力 |

---

## Twitter認証モジュール

### lib/api/twitter-auth.ts

このファイルはTwitter認証に関連するURL生成を一元管理します。ログイン、ログアウト、アカウント切り替えなど、すべてのTwitter認証フローでこのファイルの関数を使用します。

**エンドポイント定数:**

```tsx
export const TWITTER_AUTH_ENDPOINTS = {
  auth: "/api/twitter/auth",      // 認証開始
  callback: "/api/twitter/callback", // コールバック
  logout: "/api/twitter/logout",   // ログアウト
} as const;
```

**主要な関数:**

| 関数名 | 説明 | 用途 |
|--------|------|------|
| `getTwitterAuthUrl()` | 通常ログイン用URL | ログインボタン |
| `getTwitterSwitchAccountUrl()` | アカウント切り替え用URL | 別アカウントでログイン |
| `redirectToTwitterAuth()` | 認証ページにリダイレクト | ログイン処理 |
| `redirectToTwitterSwitchAccount()` | 切り替え認証ページにリダイレクト | アカウント切り替え |

---

## エラーハンドリング

### getErrorMessage関数

`getErrorMessage()` 関数は、HTTPステータスコードに応じた日本語メッセージを返します。

| ステータス | メッセージ |
|-----------|-----------|
| 0 | ネットワークエラーが発生しました。インターネット接続を確認してください。 |
| 400 | リクエストが不正です。入力内容を確認してください。 |
| 401 | 認証が必要です。再度ログインしてください。 |
| 403 | アクセスが拒否されました。 |
| 404 | リソースが見つかりませんでした。 |
| 429 | リクエストが多すぎます。しばらく待ってから再試行してください。 |
| 500/502/503 | サーバーエラーが発生しました。しばらく待ってから再試行してください。 |
| queued | オフラインです。ネットワーク復帰後に自動的に送信されます。 |

---

## API呼び出し箇所一覧

以下は、アプリケーション内でAPIを呼び出している主要な箇所の一覧です。

### fetch呼び出し（lib/api/client.ts経由）

| ファイル | 関数/コンポーネント | 使用するAPI関数 | 用途 |
|----------|---------------------|-----------------|------|
| `app/event/[id].tsx` | `handleTwitterLookup` | `lookupTwitterUser()` | 友人のTwitterユーザー検索 |
| `app/admin/api-usage.tsx` | `fetchData` | `apiGet()` | API使用状況の取得 |
| `components/organisms/account-switcher.tsx` | `handleLogout` | `clearSession()` | セッションクリア |
| `lib/token-manager.ts` | `refreshAccessToken` | `apiPost()` | トークンリフレッシュ |
| `lib/_core/api.ts` | `establishSession` | `apiPost()` | セッション確立 |
| `lib/_core/api.ts` | `checkFollowStatus` | `apiGet()` | フォローステータス確認 |

### Twitter認証関連（lib/api/twitter-auth.ts経由）

| ファイル | 関数/コンポーネント | 使用するAPI関数 | 用途 |
|----------|---------------------|-----------------|------|
| `app/logout.tsx` | `handleSameAccountLogin` | `redirectToTwitterAuth()` | 同じアカウントで再ログイン |
| `app/logout.tsx` | `handleDifferentAccountLogin` | `redirectToTwitterSwitchAccount()` | 別のアカウントでログイン |
| `components/organisms/account-switcher.tsx` | `handleAddNewAccount` | `redirectToTwitterSwitchAccount()` | 新規アカウント追加 |

---

## 新しいAPI呼び出しを追加する際のガイドライン

### 1. 新しいAPIエンドポイントの追加

新しいAPIエンドポイントを追加する場合は、以下の手順に従ってください。

1. `lib/api/endpoints.ts` に新しい関数を追加
2. 必要に応じて型定義を追加
3. `lib/api/index.ts` でエクスポート
4. 本ドキュメントの「API呼び出し箇所一覧」を更新

### 2. リトライ・キャッシュ・オフラインサポートの活用

```tsx
// 推奨パターン：重要なデータ取得
const response = await apiGet<Data>("/api/important-data", {
  retry: { maxRetries: 3 },
  apiCache: { enabled: true, ttl: 60000 },
});

// 推奨パターン：オフライン対応の書き込み
const response = await apiPost("/api/create", {
  body: data,
  queueWhenOffline: true,
});
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| v5.32 | 2025-01-17 | リトライ機能（指数バックオフ）、キャッシュ機能（メモリ/AsyncStorage）、オフラインサポート（リクエストキューイング）を追加 |
| v5.31 | 2025-01-17 | APIクライアントモジュール（client.ts）とエンドポイントモジュール（endpoints.ts）を追加。fetch呼び出しの一元化、エラーハンドリング統一、ログ機能を実装 |
| v5.29 | 2025-01-17 | 生成AI時代の設計思想を反映。1ホップ理解、コンテキストドキュメント、ハイブリッド構成の概念を追加 |
| v5.28 | 2025-01-17 | 初版作成。API一元管理アーキテクチャを導入 |

---

## 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| `docs/ARCHITECTURE.md` | システム全体の設計書 |
| `docs/DATA-FLOW.md` | データフロー設計書 |
| `server/README.md` | バックエンドAPI仕様 |
