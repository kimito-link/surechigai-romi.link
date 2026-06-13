# システムアーキテクチャ設計書

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**バージョン**: 6.181  
**最終更新**: 2026年2月2日  
**作成者**: Manus AI

---

## 概要

本ドキュメントは「動員チャレンジ」アプリケーションのシステム全体の設計を記述したものです。人間側がコードを読まなくても設計意図を理解し、改善提案や評価ができることを目的としています。

**動員チャレンジ**は、アイドル・ホスト・キャバ嬢などのエンターテイナーの生誕祭やイベントを応援するためのWebアプリケーションであり、Twitter OAuth 2.0認証、リアルタイム通知、オフライン対応などの機能を提供します。

---

## システム構成

本アプリケーションは**3層アーキテクチャ**を採用しています。フロントエンド、バックエンド、データベースの3つのレイヤーに分離することで、保守性と拡張性を確保しています。

| レイヤー | 技術スタック | 役割 |
|---------|-------------|------|
| **フロントエンド** | React Native + Expo | ユーザーインターフェース（iOS、Android、Web） |
| **バックエンド** | Express + tRPC | API・ビジネスロジック |
| **データベース** | PostgreSQL + Drizzle ORM | データ永続化 |

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                      クライアント                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   iOS App   │  │ Android App │  │   Web App   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    Expo Router                              │
│                    (File-based Routing)                     │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────┼──────────────────────────────────┐
│                     サーバー (Railway)                       │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────┐     │
│  │                Express Server                      │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │     │
│  │  │  tRPC API   │  │ Twitter OAuth│  │ WebSocket │  │     │
│  │  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │     │
│  │         │                │               │         │     │
│  │  ┌──────▼────────────────▼───────────────▼──────┐  │     │
│  │  │      ビジネスロジック層                      │  │     │
│  │  └──────────────┬───────────────────────────────┘  │     │
│  └─────────────────┼─────────────────────────────────┘     │
│                    │                                        │
│  ┌─────────────────▼─────────────────┐                     │
│  │        Drizzle ORM                 │                     │
│  └─────────────────┬─────────────────┘                     │
│                    │                                        │
│  ┌─────────────────▼─────────────────┐                     │
│  │        PostgreSQL                  │                     │
│  └───────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構造

プロジェクトは以下のディレクトリ構造で構成されています。各ディレクトリの役割を明確にすることで、開発者が迷わずコードを追加・修正できるようにしています。

| ディレクトリ | 役割 | 主要ファイル |
|-------------|------|-------------|
| `app/` | 画面コンポーネント（Expo Router） | `(tabs)/index.tsx`, `event/[id].tsx` |
| `components/` | 再利用可能なUIコンポーネント | `challenge-card.tsx`, `japan-deformed-map.tsx` |
| `hooks/` | カスタムReactフック | `use-auth.ts`, `use-colors.ts`, `use-offline-cache.ts` |
| `lib/` | ユーティリティ・共通ロジック | `trpc.ts`, `offline-cache.ts`, `utils.ts` |
| `server/` | バックエンドAPI | `_core/index.ts`, `routers/`, `twitter-oauth2.ts` |
| `server/db/` | データベーススキーマ | `schema.ts` |
| `shared/` | クライアント・サーバー共通型定義 | `types.ts` |
| `docs/` | ドキュメント | `ARCHITECTURE.md`, `DEPLOYMENT.md` |
| `assets/` | 静的アセット（画像・フォント） | `images/characters/` |
| `scripts/` | ビルド・デプロイスクリプト | `generate-build-info.cjs`, `migrate.ts` |

---

## 主要機能モジュール

### 1. 認証モジュール

Twitter OAuth 2.0 with PKCEを使用したユーザー認証を提供します。PKCEは、モバイルアプリやSPAでの認証を安全に行うための仕組みであり、クライアントシークレットを使用せずに認証を実現します。

| ファイル | 役割 |
|---------|------|
| `server/twitter-oauth2.ts` | OAuth 2.0フロー実装（認証URL生成、トークン取得） |
| `server/twitter-auth.ts` | セッション管理（Cookie発行、トークン更新） |
| `hooks/use-auth.ts` | クライアント側認証状態管理 |
| `lib/auth-provider.tsx` | 認証コンテキストプロバイダー |

**認証フロー**:

1. ユーザーがログインボタンをタップ
2. `code_verifier`と`code_challenge`を生成（PKCE）
3. Twitterの認証画面へリダイレクト
4. ユーザーがTwitterで認証を承認
5. コールバックURLでアクセストークンを取得
6. セッションCookieを発行してログイン完了

**セキュリティ対策**:

- **PKCE**: クライアントシークレットを使用せずに認証
- **State検証**: CSRF攻撃を防ぐ
- **HTTPOnly Cookie**: XSS攻撃を防ぐ
- **トークン自動更新**: リフレッシュトークンで長期間のセッションを維持

### 2. チャレンジ管理モジュール

イベント（チャレンジ）の作成・参加・進捗管理を行います。

| ファイル | 役割 |
|---------|------|
| `server/routers/events.ts` | チャレンジCRUD API |
| `app/(tabs)/create.tsx` | チャレンジ作成画面 |
| `app/event/[id].tsx` | チャレンジ詳細画面 |
| `app/dashboard/[id].tsx` | 主催者ダッシュボード |

**主要機能**:

- イベント作成（タイトル、目標人数、開催日）
- 参加登録（都道府県、コメント）
- 参加者一覧表示
- 進捗率の可視化

### 3. 可視化モジュール

参加状況を視覚的に表示するための各種グラフ・マップコンポーネントを提供します。

| ファイル | 役割 |
|---------|------|
| `components/japan-deformed-map.tsx` | 日本地図ヒートマップ（都道府県別参加者数） |
| `components/growth-trajectory-chart.tsx` | 成長軌跡グラフ（時系列データ） |
| `components/participant-ranking.tsx` | 参加者ランキング |
| `components/hourly-heatmap.tsx` | 時間帯別ヒートマップ |

### 4. 通知モジュール

プッシュ通知とアプリ内通知を管理します。

| ファイル | 役割 |
|---------|------|
| `lib/push-notifications.ts` | プッシュ通知送信 |
| `hooks/use-notification-triggers.ts` | マイルストーン検出 |
| `app/notification-settings.tsx` | 通知設定画面 |
| `server/_core/index.ts` | WebSocketサーバー（リアルタイム通知） |

**通知の種類**:

- **プッシュ通知**: アプリがバックグラウンドの時に通知
- **WebSocket通知**: アプリがフォアグラウンドの時にリアルタイム通知
- **マイルストーン通知**: 目標達成時の自動通知

### 5. オフライン対応モジュール

ネットワーク接続が不安定な環境でも、一部機能を利用できるようにします。

| ファイル | 役割 |
|---------|------|
| `lib/offline-cache.ts` | AsyncStorageによるキャッシュ管理 |
| `hooks/use-offline-cache.ts` | オフラインキャッシュフック |
| `hooks/use-prefetch.ts` | データプリフェッチ |

**キャッシュ戦略**:

- **Stale-While-Revalidate**: キャッシュを即座に返し、バックグラウンドで更新
- **Cache-First**: キャッシュが存在する場合は常にキャッシュを返す
- **Network-First**: ネットワークから取得し、失敗した場合はキャッシュを返す

---

## データモデル

主要なデータベーステーブルは以下の通りです。すべてのテーブルは`server/db/schema.ts`で定義されています。

| テーブル | 役割 | 主要カラム |
|---------|------|-----------|
| `users` | ユーザー情報 | id, twitterId, displayName, profileImageUrl, followersCount |
| `events` | チャレンジ情報 | id, title, targetCount, eventDate, creatorId, status |
| `participations` | 参加表明 | id, eventId, userId, prefecture, comment, createdAt |
| `achievements` | アチーブメント | id, userId, type, unlockedAt |
| `messages` | DM機能 | id, senderId, receiverId, content, createdAt |
| `notifications` | 通知履歴 | id, userId, type, content, isRead, createdAt |

### ER図

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   events    │       │participations│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ twitterId   │       │ title       │       │ eventId (FK)│
│ displayName │       │ targetCount │       │ userId (FK) │
│ profileImage│       │ eventDate   │       │ prefecture  │
│ followers   │       │ creatorId   │       │ comment     │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                             │
                    ┌────────▼────────┐
                    │  notifications  │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ userId (FK)     │
                    │ type            │
                    │ content         │
                    │ isRead          │
                    └─────────────────┘
```

---

## API設計

### tRPCエンドポイント

tRPCは、TypeScriptの型安全性を保ちながらAPIを定義できるフレームワークです。クライアントとサーバーで型定義を共有することで、ランタイムエラーを大幅に削減できます。

| ルーター | エンドポイント | 説明 |
|---------|---------------|------|
| `auth` | `login` | Twitter OAuth認証開始 |
| `auth` | `logout` | ログアウト |
| `auth` | `me` | 現在のユーザー情報取得 |
| `events` | `list` | イベント一覧取得 |
| `events` | `create` | イベント作成 |
| `events` | `get` | イベント詳細取得 |
| `events` | `update` | イベント更新 |
| `events` | `delete` | イベント削除 |
| `participations` | `create` | 参加登録 |
| `participations` | `list` | 参加者一覧取得 |
| `notifications` | `list` | 通知一覧取得 |
| `notifications` | `markAsRead` | 通知を既読にする |

### RESTエンドポイント

一部の機能は、RESTful APIとして提供されています。

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/health` | GET | ヘルスチェック（バージョン情報含む） |
| `/api/readyz` | GET | レディネスチェック |
| `/api/debug/env` | GET | 環境変数デバッグ（開発環境のみ） |
| `/oauth/callback` | GET | Twitter OAuthコールバック |

---

## セキュリティ設計

本アプリケーションは、以下のセキュリティ対策を実装しています。

| 項目 | 実装 |
|------|------|
| **認証** | OAuth 2.0 with PKCE（state検証、CSRF対策） |
| **トークン保存** | サーバーサイド（データベース） |
| **セッション** | HTTPOnly Cookie（XSS対策） |
| **API保護** | tRPCミドルウェアで認証チェック |
| **レート制限** | 指数バックオフによる自動リトライ |
| **入力検証** | Zodスキーマによるバリデーション |
| **SQL注入対策** | Drizzle ORMのパラメータ化クエリ |

---

## パフォーマンス最適化

本アプリケーションは、以下のパフォーマンス最適化を実装しています。

| 項目 | 実装 |
|------|------|
| **画像最適化** | expo-image（キャッシュ、優先度設定） |
| **リソースヒント** | preconnect、dns-prefetch |
| **コード分割** | Metro bundlerのTree Shaking |
| **オフライン対応** | AsyncStorageによるキャッシュ |
| **データプリフェッチ** | TanStack Queryのprefetch機能 |
| **リアルタイム更新** | WebSocketによる効率的な通信 |

---

## デプロイアーキテクチャ

本アプリケーションは、以下の環境にデプロイされています。

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   main branch                          │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           │ push
                           │
              ┌────────────▼────────────┐
              │   GitHub Actions        │
              │  (CI/CD Pipeline)       │
              └────────┬────────┬───────┘
                       │        │
         ┌─────────────┘        └─────────────┐
         │                                    │
         │ deploy                             │ deploy
         │                                    │
┌────────▼────────┐                  ┌────────▼────────┐
│     Railway     │                  │     Vercel      │
│  (Backend API)  │                  │   (Frontend)    │
├─────────────────┤                  ├─────────────────┤
│ Express Server  │◄─────────────────┤ Static Files    │
│ PostgreSQL DB   │      API Call    │ (HTML/CSS/JS)   │
└─────────────────┘                  └─────────────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  doin-challenge │
│      .com       │
└─────────────────┘
```

| 環境 | プラットフォーム | 役割 |
|------|----------------|------|
| **バックエンド** | Railway | Express + tRPC + PostgreSQL |
| **フロントエンド** | Vercel | 静的ファイル配信 |
| **CI/CD** | GitHub Actions | 自動デプロイ |

---

## 拡張ポイント

将来的な機能拡張を想定した設計ポイントは以下の通りです。

### 1. 新しい可視化コンポーネント

`components/`ディレクトリに新しいコンポーネントを追加するだけで、すぐに利用可能です。既存のコンポーネントと同じインターフェースを実装することで、一貫性を保てます。

### 2. 新しいAPIエンドポイント

`server/routers/`ディレクトリに新しいルーターファイルを追加し、`server/routers.ts`でインポートするだけで、tRPCエンドポイントを追加できます。

### 3. 新しい画面

`app/`ディレクトリにファイルを追加するだけで、Expo Routerが自動的にルーティングを設定します。ファイル名がそのままURLパスになります。

### 4. 新しいアチーブメント

`shared/achievements.ts`に定義を追加するだけで、新しいアチーブメントを追加できます。

---

## 評価チェックリスト

人間側がこのシステムを評価する際のチェックポイント：

- [ ] 認証フローは安全か（PKCE、state検証）
- [ ] データベース設計は正規化されているか
- [ ] コンポーネントは再利用可能か
- [ ] エラーハンドリングは適切か
- [ ] パフォーマンス最適化は十分か
- [ ] ドキュメントは最新か
- [ ] テストカバレッジは十分か（99.86%達成）
- [ ] デプロイプロセスは自動化されているか

---

## 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
