# 君斗りんくの動員ちゃれんじ - プロジェクトサマリー

**バージョン**: v6.04  
**最終更新**: 2026年1月19日  
**作成者**: Manus AI

---

## 1. プロジェクト概要

「君斗りんくの動員ちゃれんじ」は、アイドル・ホスト・キャバ嬢などのクリエイターが、ライブ・配信・SNSなどの目標達成をファンと一緒にチャレンジするモバイルアプリである。ファンは参加表明を通じて推しを応援し、目標達成に向けた進捗を可視化することで、コミュニティの一体感を醸成する。

### コアコンセプト

| 項目 | 説明 |
|------|------|
| **ターゲットユーザー** | アイドル・ホスト・キャバ嬢などのクリエイター（主催者）とそのファン（参加者） |
| **主な機能** | チャレンジ作成、参加表明、進捗可視化、地域別マップ、応援メッセージ |
| **ブランドカラー** | 青: #00427B（KimitoLinkブルー）、オレンジ: #DD6500（KimitoLinkオレンジ） |
| **キャラクター** | りんくちゃん（メイン）、こん太（きつね）、たぬ姉（たぬき） |

### 対応する目標タイプ

| タイプ | 単位 | 用途例 |
|--------|------|--------|
| 動員（attendance） | 人 | ライブ・イベント参加者数 |
| フォロワー（followers） | 人 | Twitter/Instagram等のフォロワー増加 |
| 同時視聴（viewers） | 人 | YouTubeプレミア・配信の同接数 |
| 応援ポイント（points） | pt | ミクチャ等のイベントポイント |
| カスタム（custom） | 自由 | その他の目標 |

---

## 2. 技術スタック

### フロントエンド

| 技術 | バージョン | 役割 |
|------|-----------|------|
| **React Native** | 0.81.5 | クロスプラットフォームUI |
| **Expo** | SDK 54 | 開発・ビルド環境 |
| **Expo Router** | 6.0.19 | ファイルベースルーティング |
| **NativeWind** | 4.2.1 | Tailwind CSSスタイリング |
| **TypeScript** | 5.9.3 | 型安全な開発 |
| **TanStack Query** | 5.90.12 | サーバー状態管理 |

### バックエンド

| 技術 | バージョン | 役割 |
|------|-----------|------|
| **Express** | 4.22.1 | HTTPサーバー |
| **tRPC** | 11.7.2 | 型安全なAPI |
| **Drizzle ORM** | 0.44.7 | データベースアクセス |
| **MySQL2** | 3.16.0 | MySQLドライバー |
| **Zod** | 4.2.1 | スキーマバリデーション |

### インフラストラクチャ

| サービス | 役割 |
|---------|------|
| **Railway** | フロントエンド・バックエンド・データベースホスティング |
| **TiDB Cloud** | MySQL互換分散データベース |
| **Twitter API v2** | OAuth 2.0認証、ユーザー情報取得 |

---

## 3. アーキテクチャ

### システム構成図

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
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                     Railway                                  │
│                          │                                  │
│  ┌───────────────────────▼───────────────────────────┐     │
│  │                Express Server                      │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │     │
│  │  │  tRPC API   │  │ Twitter OAuth│  │ 静的配信  │  │     │
│  │  └──────┬──────┘  └──────┬──────┘  └───────────┘  │     │
│  │         │                │                         │     │
│  │  ┌──────▼────────────────▼──────┐                 │     │
│  │  │      ビジネスロジック層       │                 │     │
│  │  └──────────────┬───────────────┘                 │     │
│  └─────────────────┼─────────────────────────────────┘     │
│                    │                                        │
│  ┌─────────────────▼─────────────────┐                     │
│  │        Drizzle ORM                 │                     │
│  └─────────────────┬─────────────────┘                     │
└────────────────────┼────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  TiDB Cloud (MySQL)                          │
└──────────────────────────────────────────────────────────────┘
```

### レイヤー構成

| レイヤー | ディレクトリ | 役割 |
|---------|-------------|------|
| **画面** | `app/` | Expo Routerによるページコンポーネント |
| **コンポーネント** | `components/` | 再利用可能なUIコンポーネント（Atomic Design） |
| **フック** | `hooks/` | カスタムReactフック |
| **ライブラリ** | `lib/` | ユーティリティ・共通ロジック |
| **サーバー** | `server/` | バックエンドAPI・認証 |
| **スキーマ** | `drizzle/` | データベーススキーマ定義 |
| **共有** | `shared/` | クライアント・サーバー共通型定義 |

---

## 4. ディレクトリ構造

```
birthday-celebration/
├── app/                          # 画面コンポーネント（Expo Router）
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブレイアウト
│   │   ├── index.tsx             # ホーム画面（チャレンジ一覧）
│   │   ├── create.tsx            # チャレンジ作成画面
│   │   └── mypage.tsx            # マイページ
│   ├── event/[id].tsx            # チャレンジ詳細画面
│   ├── dashboard/[id].tsx        # 主催者ダッシュボード
│   ├── admin/                    # 管理者画面
│   └── _layout.tsx               # ルートレイアウト
│
├── components/                   # UIコンポーネント（Atomic Design）
│   ├── atoms/                    # 基本要素（ボタン、テキスト等）
│   ├── molecules/                # 複合要素（カード、フォーム等）
│   └── organisms/                # 複雑な要素（ヘッダー、マップ等）
│
├── hooks/                        # カスタムフック
│   ├── use-auth.ts               # 認証状態管理
│   ├── use-colors.ts             # テーマカラー
│   ├── use-offline-cache.ts      # オフラインキャッシュ
│   └── use-tutorial.ts           # チュートリアル状態
│
├── lib/                          # ユーティリティ
│   ├── trpc.ts                   # tRPCクライアント
│   ├── offline-cache.ts          # オフラインキャッシュ
│   ├── push-notifications.ts     # プッシュ通知
│   └── theme-provider.tsx        # テーマプロバイダー
│
├── server/                       # バックエンド
│   ├── _core/                    # コアサーバー機能
│   │   ├── index.ts              # サーバーエントリポイント
│   │   ├── context.ts            # tRPCコンテキスト
│   │   ├── trpc.ts               # tRPC設定
│   │   └── oauth.ts              # OAuth設定
│   ├── routers.ts                # APIルーター定義
│   ├── db.ts                     # データベース操作
│   ├── twitter-oauth2.ts         # Twitter OAuth 2.0
│   └── twitter-routes.ts         # Twitter関連ルート
│
├── drizzle/                      # データベース
│   ├── schema.ts                 # テーブル定義
│   └── relations.ts              # リレーション定義
│
├── shared/                       # 共有コード
│   ├── types.ts                  # 型定義エクスポート
│   ├── version.ts                # バージョン管理
│   └── const.ts                  # 定数
│
├── assets/                       # 静的アセット
│   └── images/
│       ├── characters/           # キャラクター画像
│       └── logo/                 # ロゴ画像
│
├── docs/                         # ドキュメント
│   ├── ARCHITECTURE.md           # アーキテクチャ設計書
│   ├── project-summary.md        # プロジェクトサマリー（本ファイル）
│   └── code-reference.md         # コードリファレンス
│
├── __tests__/                    # テストファイル
├── package.json                  # 依存関係
├── tsconfig.json                 # TypeScript設定
├── tailwind.config.js            # Tailwind設定
└── drizzle.config.ts             # Drizzle設定
```

---

## 5. 主要機能

### 5.1 認証システム

Twitter OAuth 2.0 with PKCEを使用したセキュアな認証を実装している。

**認証フロー**:
1. ユーザーがログインボタンをタップ
2. code_verifier/code_challengeを生成（PKCE）
3. Twitterの認証画面へリダイレクト
4. コールバックでアクセストークンを取得
5. セッションCookieを発行してログイン完了

**関連ファイル**:
- `server/twitter-oauth2.ts` - OAuth 2.0フロー実装
- `server/twitter-auth.ts` - セッション管理
- `hooks/use-auth.ts` - クライアント側認証状態管理
- `lib/token-manager.ts` - トークン自動更新

### 5.2 チャレンジ管理

イベント（チャレンジ）の作成・参加・進捗管理を行う。

**機能**:
- チャレンジの作成・編集・削除
- 参加表明の登録
- 進捗状況の自動計算
- 地域別参加者集計

**関連ファイル**:
- `server/routers.ts` - チャレンジCRUD API
- `app/(tabs)/create.tsx` - チャレンジ作成画面
- `app/event/[id].tsx` - チャレンジ詳細画面
- `app/dashboard/[id].tsx` - 主催者ダッシュボード

### 5.3 可視化機能

参加状況を視覚的に表示する。

**コンポーネント**:
- `components/organisms/japan-deformed-map.tsx` - 日本地図ヒートマップ
- `components/organisms/growth-trajectory-chart.tsx` - 成長軌跡グラフ
- `components/organisms/participant-ranking.tsx` - 参加者ランキング

### 5.4 オフライン対応

ネットワーク接続がない状態でもアプリを使用可能にする。

**機能**:
- チャレンジデータのキャッシュ
- オフライン時の表示対応
- ネットワーク状態の監視
- オフライン操作の同期

**関連ファイル**:
- `lib/offline-cache.ts` - キャッシュ管理
- `lib/offline-sync.ts` - 同期処理
- `hooks/use-offline-cache.ts` - キャッシュフック

---

## 6. データモデル

### 主要テーブル

| テーブル | 役割 | 主要カラム |
|---------|------|-----------|
| `users` | ユーザー情報 | id, openId, name, email, role |
| `challenges` | チャレンジ情報 | id, title, goalType, goalValue, eventDate, hostTwitterId |
| `participations` | 参加表明 | id, challengeId, userId, displayName, message, companionCount |
| `notifications` | 通知履歴 | id, userId, challengeId, type, title, body |
| `badges` | バッジマスター | id, name, type, conditionType |
| `achievements` | アチーブメント | id, name, type, conditionType |

### チャレンジテーブル詳細

```typescript
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  // ホスト情報
  hostUserId: int("hostUserId"),
  hostTwitterId: varchar("hostTwitterId", { length: 64 }),
  hostName: varchar("hostName", { length: 255 }).notNull(),
  hostUsername: varchar("hostUsername", { length: 255 }),
  hostProfileImage: text("hostProfileImage"),
  hostFollowersCount: int("hostFollowersCount").default(0),
  // チャレンジ情報
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // 目標設定
  goalType: mysqlEnum("goalType", ["attendance", "followers", "viewers", "points", "custom"]),
  goalValue: int("goalValue").default(100).notNull(),
  goalUnit: varchar("goalUnit", { length: 32 }).default("人").notNull(),
  currentValue: int("currentValue").default(0).notNull(),
  // イベント情報
  eventType: mysqlEnum("eventType", ["solo", "group"]).default("solo").notNull(),
  eventDate: timestamp("eventDate").notNull(),
  venue: varchar("venue", { length: 255 }),
  prefecture: varchar("prefecture", { length: 32 }),
  // チケット情報
  ticketPresale: int("ticketPresale"),
  ticketDoor: int("ticketDoor"),
  ticketUrl: text("ticketUrl"),
  // ステータス
  status: mysqlEnum("status", ["upcoming", "active", "ended"]).default("active").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  // タイムスタンプ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

---

## 7. API設計

### tRPCルーター構造

```typescript
appRouter = router({
  system: systemRouter,           // システム関連
  auth: router({                  // 認証関連
    me: publicProcedure,          // 現在のユーザー取得
    logout: publicProcedure,      // ログアウト
  }),
  events: router({                // チャレンジ関連
    list: publicProcedure,        // 一覧取得
    listPaginated: publicProcedure, // ページネーション付き一覧
    getById: publicProcedure,     // 詳細取得
    myEvents: protectedProcedure, // 自分のチャレンジ
    create: publicProcedure,      // 作成
    update: protectedProcedure,   // 更新
    delete: protectedProcedure,   // 削除
  }),
  participations: router({        // 参加登録関連
    listByEvent: publicProcedure, // イベント別一覧
    myParticipations: protectedProcedure, // 自分の参加一覧
    create: publicProcedure,      // 参加登録
    update: protectedProcedure,   // 更新
    delete: protectedProcedure,   // 削除
  }),
  // ... その他のルーター
});
```

### RESTエンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/health` | GET | ヘルスチェック |
| `/api/twitter/login` | GET | Twitter認証開始 |
| `/api/twitter/callback` | GET | Twitter認証コールバック |
| `/api/admin/system-status` | GET | システム状態確認 |
| `/api/admin/api-usage` | GET | API使用量 |
| `/api/admin/errors` | GET | エラーログ |

---

## 8. 環境変数

### 必須環境変数

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | データベース接続URL |
| `TWITTER_CLIENT_ID` | Twitter API Client ID |
| `TWITTER_CLIENT_SECRET` | Twitter API Client Secret |
| `SESSION_SECRET` | セッション暗号化キー |
| `EXPO_PUBLIC_API_BASE_URL` | APIベースURL |

### オプション環境変数

| 変数名 | 説明 |
|--------|------|
| `TWITTER_BEARER_TOKEN` | Twitter Bearer Token |
| `PORT` | サーバーポート（デフォルト: 3000） |

---

## 9. デプロイ構成

### Railway設定

現在、フロントエンド・バックエンド・データベースをRailwayに統合している。

**ビルドコマンド**:
```bash
pnpm install && pnpm build
```

**スタートコマンド**:
```bash
pnpm start
```

**ドメイン設定**:
- `doin-challenge.com` - メインドメイン
- `www.doin-challenge.com` - WWWサブドメイン

### DNS設定（XServer）

| レコード | タイプ | 値 |
|---------|-------|-----|
| `doin-challenge.com` | A | 66.33.22.8 |
| `www.doin-challenge.com` | CNAME | 6kvjnto8.up.railway.app |

---

## 10. 開発ガイド

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（フロントエンド + バックエンド）
pnpm dev

# 型チェック
pnpm check

# テスト実行
pnpm test

# リント
pnpm lint
```

### 新機能追加の流れ

1. **データベース変更が必要な場合**:
   - `drizzle/schema.ts`にテーブル/カラムを追加
   - `pnpm db:push`でマイグレーション実行

2. **APIエンドポイント追加**:
   - `server/routers.ts`にプロシージャを追加
   - `server/db.ts`にデータベース操作関数を追加

3. **画面追加**:
   - `app/`ディレクトリにファイルを追加（自動ルーティング）
   - 必要なコンポーネントを`components/`に作成

4. **テスト作成**:
   - `__tests__/`にテストファイルを追加
   - `pnpm test`で実行確認

---

## 11. 既知の制限事項

| 項目 | 説明 | 回避策 |
|------|------|--------|
| AI関連カラム | `aiSummary`等のカラムは本番DBに未マイグレーション | INSERTから除外済み |
| 日程未定 | 9999-12-31を特殊値として使用 | UIで「未定」と表示 |
| Twitter API制限 | レート制限あり | 指数バックオフで対応 |

---

## 12. 今後の拡張予定

- [ ] 統計データのエクスポート機能
- [ ] アチーブメント解除通知
- [ ] 画像の遅延読み込み最適化
- [ ] サイト全体のパフォーマンス改善

---

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
