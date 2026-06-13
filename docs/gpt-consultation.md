# GPT相談用ドキュメント：動員チャレンジ（doin-challenge.com）

## 相談の目的

AIも人間も理解しやすいデータベース設計、コンポーネント化、既存機能を壊さない開発フローについてアドバイスをいただきたい。

---

## 1. アプリ概要

**動員チャレンジ**は、アイドルやアーティストのライブ・イベントへの動員目標を設定し、ファンと一緒に達成を目指すプラットフォームです。

### サービスURL
- **本番サイト**: https://doin-challenge.com

### 主要なユーザーロール
- **主催者（ホスト）**: チャレンジを作成し、動員目標を設定してファンを集める
- **参加者（ファン）**: チャレンジに参加表明し、応援メッセージを送る
- **管理者**: システム全体を管理

### 主な機能
- ライブ・イベントの動員目標チャレンジを作成
- ファンが参加表明（何人で行くか、同伴者含む）
- リアルタイムで達成率を表示
- 応援メッセージ・コメント機能
- 達成時の記念ページ作成

---

## 2. インフラ構成

### 2.1 現在のホスティング構成

```
┌─────────────────────────────────────────────────────────────┐
│                      ユーザー                               │
│                         │                                   │
│                         ▼                                   │
│              https://doin-challenge.com                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Vercel                                   │
│              （フロントエンド）                              │
│                                                             │
│  - React Native (Expo) アプリをWebとしてホスティング        │
│  - 静的ファイル配信                                         │
│  - 自動デプロイ（GitHubプッシュ時）                         │
│  - CDNによるグローバル配信                                  │
│                                                             │
│  デプロイURL: https://doin-challenge.com                    │
│  GitHubリポジトリ: kimito-link/doin-challenge.com           │
└─────────────────────────┬───────────────────────────────────┘
                          │ API呼び出し
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Railway                                  │
│              （バックエンド）                                │
│                                                             │
│  - Node.js + Express サーバー                               │
│  - tRPC APIエンドポイント                                   │
│  - 自動デプロイ（GitHubプッシュ時）                         │
│                                                             │
│  API URL: https://api.doin-challenge.com                    │
│  （または Railway提供のURL）                                │
└─────────────────────────┬───────────────────────────────────┘
                          │ DB接続
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    TiDB Cloud                               │
│              （データベース）                                │
│                                                             │
│  - MySQL互換の分散データベース                              │
│  - SSL接続必須                                              │
│  - Serverlessプラン使用                                     │
│                                                             │
│  接続: DATABASE_URL環境変数で設定                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 デプロイフロー

```
開発者がコード変更
       │
       ▼
GitHub (main branch) にプッシュ
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  │
    Vercel            Railway               │
  自動ビルド         自動ビルド              │
  自動デプロイ       自動デプロイ            │
       │                  │                  │
       ▼                  ▼                  │
  フロントエンド      バックエンド           │
    更新完了           更新完了              │
                                            │
                          TiDB Cloud ◄──────┘
                        （DBは変更なし）
```

### 2.3 環境変数

**Vercel側:**
- `VITE_API_URL`: バックエンドAPIのURL

**Railway側:**
- `DATABASE_URL`: TiDB Cloudの接続文字列
- `SESSION_SECRET`: セッション暗号化キー
- `TWITTER_CLIENT_ID`: Twitter OAuth用
- `TWITTER_CLIENT_SECRET`: Twitter OAuth用

---

## 3. 現在の機能一覧

### 3.1 画面一覧（44画面）

| カテゴリ | 画面 | ファイル | 説明 |
|---------|------|----------|------|
| **メイン** | ホーム | `app/(tabs)/index.tsx` | チャレンジ一覧、注目チャレンジ表示 |
| | チャレンジ作成 | `app/(tabs)/create.tsx` | 新規チャレンジ作成フォーム |
| | マイページ | `app/(tabs)/mypage.tsx` | 自分の参加・主催チャレンジ一覧 |
| **チャレンジ** | チャレンジ詳細 | `app/event/[id].tsx` | チャレンジの詳細、参加者一覧、達成率 |
| | ダッシュボード | `app/dashboard/[id].tsx` | 主催者用の管理画面 |
| | 編集 | `app/edit-challenge/[id].tsx` | チャレンジ編集 |
| | 達成ページ | `app/achievement/[id].tsx` | 目標達成時の記念ページ |
| | リマインダー | `app/reminders/[id].tsx` | 参加者へのリマインダー設定 |
| | コメント管理 | `app/manage-comments/[id].tsx` | ピックアップコメント管理 |
| | 協力者管理 | `app/collaborators/[id].tsx` | 共同主催者の管理 |
| **参加** | 参加編集 | `app/edit-participation/[id].tsx` | 参加情報の編集 |
| | 招待 | `app/invite/[id].tsx` | 招待リンク経由の参加 |
| **ユーザー** | プロフィール | `app/profile/[userId].tsx` | ユーザープロフィール |
| | フォロー | `app/followers.tsx`, `app/following.tsx` | フォロー/フォロワー一覧 |
| | 設定 | `app/settings.tsx` | アカウント設定 |
| | 通知設定 | `app/notification-settings.tsx` | 通知の設定 |
| | 通知一覧 | `app/notifications.tsx` | 通知一覧 |
| | テーマ設定 | `app/theme-settings.tsx` | ダーク/ライトモード |
| **メッセージ** | DM一覧 | `app/messages/index.tsx` | ダイレクトメッセージ一覧 |
| | DM詳細 | `app/messages/[partnerId].tsx` | 個別のDM画面 |
| **その他** | ランキング | `app/rankings.tsx` | 貢献度ランキング |
| | 達成一覧 | `app/achievements.tsx` | 達成バッジ一覧 |
| | テンプレート | `app/templates/index.tsx` | チャレンジテンプレート |
| | ヘルプ | `app/help.tsx` | ヘルプ・FAQ |
| | リリースノート | `app/release-notes.tsx` | 更新履歴 |
| | デモ（追体験） | `app/demo/index.tsx` | サービス追体験機能 |
| **管理者** | 管理トップ | `app/admin/index.tsx` | 管理者ダッシュボード |
| | ユーザー管理 | `app/admin/users.tsx` | ユーザー一覧・権限管理 |
| | チャレンジ管理 | `app/admin/challenges.tsx` | 全チャレンジ管理 |
| | カテゴリ管理 | `app/admin/categories.tsx` | カテゴリ設定 |
| | API使用状況 | `app/admin/api-usage.tsx` | API使用量モニタリング |
| | エラーログ | `app/admin/errors.tsx` | エラーログ確認 |
| | システム | `app/admin/system.tsx` | システム設定 |
| | データ整合性 | `app/admin/data-integrity.tsx` | データ整合性チェック |
| | コンポーネント | `app/admin/component-gallery.tsx` | UIコンポーネント一覧 |

---

## 4. データベース構造

### 4.1 テーブル一覧（26テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `users` | ユーザー情報 | id, openId, name, email, role |
| `challenges` | チャレンジ（動員目標） | id, hostTwitterId, title, eventDate, goalValue, currentValue |
| `participations` | 参加登録 | id, challengeId, userId, contribution, message, companionCount |
| `notifications` | 通知 | id, userId, type, message, isRead |
| `notification_settings` | 通知設定 | id, userId, emailEnabled, pushEnabled |
| `badges` | バッジ定義 | id, name, description, iconUrl |
| `user_badges` | ユーザーのバッジ | id, userId, badgeId |
| `picked_comments` | ピックアップコメント | id, challengeId, participationId |
| `cheers` | 応援（いいね） | id, participationId, userId |
| `achievement_pages` | 達成ページ | id, challengeId, content |
| `reminders` | リマインダー | id, challengeId, scheduledAt |
| `direct_messages` | DM | id, senderId, receiverId, content |
| `challenge_templates` | テンプレート | id, userId, title, description |
| `follows` | フォロー関係 | id, followerId, followingId |
| `search_history` | 検索履歴 | id, userId, query |
| `categories` | カテゴリ | id, name, slug |
| `invitations` | 招待 | id, challengeId, code |
| `invitation_uses` | 招待使用履歴 | id, invitationId, userId |
| `challenge_stats` | チャレンジ統計 | id, challengeId, viewCount |
| `achievements` | 達成定義 | id, name, condition |
| `user_achievements` | ユーザー達成 | id, userId, achievementId |
| `collaborators` | 協力者 | id, challengeId, userId |
| `collaborator_invitations` | 協力者招待 | id, challengeId, email |
| `participation_companions` | 同伴者 | id, participationId, name |
| `ticket_transfers` | チケット譲渡 | id, challengeId, userId |
| `ticket_waitlist` | チケット待機リスト | id, challengeId, userId |
| `favorite_artists` | お気に入りアーティスト | id, userId, artistName |

### 4.2 challengesテーブル詳細（主要テーブル）

```sql
CREATE TABLE challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- ホスト（主催者）情報
  hostUserId INT,                          -- usersテーブルのID（オプション）
  hostTwitterId VARCHAR(64),               -- Twitter ID（認証に使用）
  hostName VARCHAR(255) NOT NULL,          -- 表示名
  hostUsername VARCHAR(255),               -- Twitterユーザー名
  hostProfileImage TEXT,                   -- プロフィール画像URL
  hostFollowersCount INT DEFAULT 0,        -- フォロワー数
  hostDescription TEXT,                    -- 自己紹介
  
  -- チャレンジ情報
  title VARCHAR(255) NOT NULL,             -- チャレンジ名（例：「○○ワンマン動員100人チャレンジ」）
  slug VARCHAR(255),                       -- URL用スラッグ
  description TEXT,                        -- 詳細説明
  
  -- 目標設定
  goalType ENUM('attendance', 'followers', 'viewers', 'points', 'custom') DEFAULT 'attendance',
  goalValue INT DEFAULT 100,               -- 目標値（例：100人）
  goalUnit VARCHAR(32) DEFAULT '人',       -- 単位
  currentValue INT DEFAULT 0,              -- 現在の達成値
  
  -- イベント種別
  eventType ENUM('solo', 'group') DEFAULT 'solo',  -- ソロ/グループ
  categoryId INT,                          -- カテゴリID
  
  -- 日時・場所
  eventDate TIMESTAMP NOT NULL,            -- イベント開催日
  venue VARCHAR(255),                      -- 会場名
  prefecture VARCHAR(32),                  -- 都道府県
  
  -- チケット情報
  ticketPresale INT,                       -- 前売り価格
  ticketDoor INT,                          -- 当日価格
  ticketSaleStart TIMESTAMP,               -- 販売開始日
  ticketUrl TEXT,                          -- チケット購入URL
  externalUrl TEXT,                        -- 外部リンク（YouTube等）
  
  -- ステータス
  status ENUM('upcoming', 'active', 'ended') DEFAULT 'active',
  isPublic BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- AI向け最適化カラム（※問題の原因となっている可能性）
  aiSummary TEXT,                          -- AIが生成したサマリー
  intentTags JSON,                         -- 意図タグ
  regionSummary JSON,                      -- 地域別参加者数
  participantSummary JSON,                 -- 参加者サマリー
  aiSummaryUpdatedAt TIMESTAMP             -- AI更新日時
);
```

### 4.3 participationsテーブル詳細

```sql
CREATE TABLE participations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challengeId INT NOT NULL,                -- 参加するチャレンジID
  userId INT,                              -- ユーザーID（ログイン時）
  twitterId VARCHAR(64),                   -- Twitter ID
  userName VARCHAR(255) NOT NULL,          -- 表示名
  userUsername VARCHAR(255),               -- Twitterユーザー名
  userImage TEXT,                          -- プロフィール画像
  contribution INT DEFAULT 1,              -- 貢献数（通常1）
  companionCount INT DEFAULT 0,            -- 同伴者数
  message TEXT,                            -- 応援メッセージ
  prefecture VARCHAR(32),                  -- 参加者の都道府県
  status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (challengeId) REFERENCES challenges(id)
);
```

---

## 5. APIエンドポイント一覧

### 5.1 主要API（26ルーター）

| ルーター | 主なエンドポイント | 説明 |
|----------|-------------------|------|
| `auth` | me, logout | 認証状態確認、ログアウト |
| `events` | list, create, update, delete, getById | チャレンジCRUD |
| `participations` | create, update, delete, getByEventId | 参加CRUD |
| `notifications` | list, markAsRead, markAllAsRead | 通知管理 |
| `badges` | list, getUserBadges | バッジ取得 |
| `pickedComments` | list, create, delete | ピックアップコメント |
| `cheers` | create, delete, getCount | 応援（いいね） |
| `achievements` | list, getUserAchievements | 達成バッジ |
| `reminders` | list, create, delete | リマインダー |
| `dm` | list, send, getConversation | ダイレクトメッセージ |
| `templates` | list, create, delete | テンプレート |
| `follows` | follow, unfollow, getFollowers | フォロー機能 |
| `rankings` | getTopContributors | ランキング |
| `categories` | list, create | カテゴリ管理 |
| `invitations` | create, use, getByCode | 招待機能 |
| `profiles` | getByUserId, update | プロフィール |
| `companions` | list, create, delete | 同伴者管理 |
| `ticketTransfer` | list, create, cancel | チケット譲渡 |
| `ticketWaitlist` | add, remove, list | 待機リスト |
| `admin` | users, updateUserRole, getDbSchema | 管理者機能 |

---

## 6. アクションボタンと挙動

### 6.1 チャレンジ作成画面（create.tsx）

| ボタン | 呼び出すAPI | 書き込むテーブル | 処理内容 |
|--------|------------|-----------------|----------|
| 「チャレンジを作成」 | `events.create` | `challenges` | 新規チャレンジをINSERT |
| 「テンプレートとして保存」 | `templates.create` | `challenge_templates` | テンプレートをINSERT |

**events.create の処理フロー:**
```
1. フロントエンド（create.tsx）
   └─ フォームデータを収集（title, eventDate, goalValue, venue等）
   └─ バリデーション実行
   
2. API呼び出し
   └─ trpc.events.create.mutate(data)
   └─ Railway上のバックエンドにHTTPリクエスト
   
3. サーバー（routers.ts）
   └─ 入力値のバリデーション（zodスキーマ）
   └─ db.createEvent(data) を呼び出し
   
4. データベース操作（db.ts）
   └─ SQL INSERT文を実行
   └─ TiDB Cloudに接続してデータ保存
   
5. 結果返却
   └─ 作成されたチャレンジIDを返す
   └─ フロントエンドで詳細画面に遷移
```

### 6.2 チャレンジ詳細画面（event/[id].tsx）

| ボタン | 呼び出すAPI | 書き込むテーブル | 処理内容 |
|--------|------------|-----------------|----------|
| 「参加する」 | `participations.create` | `participations`, `challenges` | 参加登録、currentValue更新 |
| 「応援する」 | `cheers.create` | `cheers` | 応援をINSERT |
| 「シェア」 | なし（ブラウザAPI） | なし | SNSシェア |
| 「編集」 | 画面遷移 | なし | edit-challenge画面へ |

**participations.create の処理フロー:**
```
1. フロントエンド（event/[id].tsx）
   └─ 参加フォーム表示（同伴者数、メッセージ等）
   └─ 入力データ収集
   
2. API呼び出し
   └─ trpc.participations.create.mutate(data)
   
3. サーバー（routers.ts → db.ts）
   └─ participationsテーブルにINSERT
   └─ challengesテーブルのcurrentValueを更新
      └─ currentValue += contribution + companionCount
   
4. 結果返却
   └─ 参加IDを返す
   └─ 画面の参加者リストを更新
```

### 6.3 ダッシュボード（dashboard/[id].tsx）

| ボタン | 呼び出すAPI | 書き込むテーブル | 処理内容 |
|--------|------------|-----------------|----------|
| 「コメントをピック」 | `pickedComments.create` | `picked_comments` | ピックアップ登録 |
| 「リマインダー送信」 | `reminders.create` | `reminders`, `notifications` | リマインダー作成・通知送信 |
| 「達成ページ編集」 | `achievements.update` | `achievement_pages` | 達成ページ更新 |
| 「協力者追加」 | `collaborators.invite` | `collaborator_invitations` | 招待送信 |

### 6.4 マイページ（mypage.tsx）

| ボタン | 呼び出すAPI | 書き込むテーブル | 処理内容 |
|--------|------------|-----------------|----------|
| 「チャレンジを見る」 | 画面遷移 | なし | event画面へ |
| 「参加をキャンセル」 | `participations.delete` | `participations`, `challenges` | 参加削除、currentValue減算 |

---

## 7. 現状の問題点

### 7.1 発生している問題

**問題1: チャレンジ作成が500エラーで失敗する**

- **症状**: 「チャレンジを作成」ボタンを押すと500 Internal Server Error
- **推定原因**: 
  - コードで定義しているカラム（aiSummary, intentTags, regionSummary, participantSummary, aiSummaryUpdatedAt）が本番TiDB Cloudに存在しない
  - drizzle/schema.tsで定義しているが、マイグレーションが本番に適用されていない
- **影響**: 新規チャレンジが作成できない（サービスの根幹機能が使えない）

**問題2: コードとDBの不整合**

- **症状**: 開発中に追加したカラムが本番DBに反映されていない
- **原因**: 
  - `drizzle-kit push` が本番DBに対して実行されていない
  - ローカル開発とデプロイの間でDBスキーマの同期が取れていない
- **影響**: INSERT/UPDATEが失敗する

**問題3: 変更時に既存機能が壊れる**

- **症状**: 新機能追加時に既存のAPIが動かなくなる
- **原因**: 
  - テーブル構造の変更がコード全体に影響
  - テストがない
  - 変更の影響範囲が把握できていない
  - Vercel/Railway両方にデプロイが必要だが、片方だけ更新されることがある

### 7.2 ミスが起こる原因

1. **スキーマとコードの分離**
   - `drizzle/schema.ts` でスキーマを定義
   - `server/db.ts` で直接SQLを書いている箇所がある（createEvent関数）
   - 両者の整合性が保証されていない

2. **マイグレーションの未適用**
   - ローカルでスキーマを変更しても、本番TiDB Cloudに反映されない
   - `drizzle-kit push` が本番に対して実行されていない
   - デプロイ時にマイグレーションが自動実行されない

3. **影響範囲の不明確さ**
   - テーブルを変更した時、どのAPIが影響を受けるか分からない
   - APIを変更した時、どの画面が影響を受けるか分からない
   - VercelとRailwayの両方を更新する必要があることを忘れる

4. **テストの欠如**
   - 単体テスト、統合テストがない
   - 変更後の動作確認が手動のみ
   - 本番環境でしかエラーが発覚しない

5. **デプロイの複雑さ**
   - GitHubにプッシュ → Vercel自動デプロイ
   - GitHubにプッシュ → Railway自動デプロイ
   - TiDB Cloudは手動でマイグレーション必要
   - 3つの環境を同期させる必要がある

---

## 8. 再発防止のための構造提案

### 8.1 理想的なアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        フロントエンド                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ 画面A   │  │ 画面B   │  │ 画面C   │  │ 画面D   │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                         │                                   │
│                    ┌────▼────┐                              │
│                    │ tRPC    │  ← 型安全なAPI呼び出し       │
│                    └────┬────┘                              │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    バックエンド                              │
│                    ┌────▼────┐                              │
│                    │ Router  │  ← APIエンドポイント定義      │
│                    └────┬────┘                              │
│                         │                                   │
│                    ┌────▼────┐                              │
│                    │ Service │  ← ビジネスロジック          │
│                    └────┬────┘                              │
│                         │                                   │
│                    ┌────▼────┐                              │
│                    │ Drizzle │  ← ORM（型安全なDB操作）     │
│                    └────┬────┘                              │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    データベース                              │
│                    ┌────▼────┐                              │
│                    │ TiDB    │  ← MySQL互換                 │
│                    └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 提案する改善策

#### A. スキーマ管理の一元化

```typescript
// 1. スキーマは drizzle/schema.ts のみで定義
// 2. db.ts では Drizzle ORM のみを使用（生SQL禁止）
// 3. マイグレーションは drizzle-kit で管理

// 悪い例（現状）- db.tsで直接SQLを書いている
await db.execute(sql`INSERT INTO challenges (...) VALUES (...)`);

// 良い例 - Drizzle ORMを使用
await db.insert(challenges).values(data);
```

#### B. デプロイ時の自動マイグレーション

```yaml
# Railway デプロイ時に自動実行
scripts:
  build: pnpm build
  start: pnpm db:push && pnpm start  # マイグレーション後にサーバー起動
```

#### C. 依存関係の可視化

```typescript
// components/dependency-map.ts
export const DEPENDENCY_MAP = {
  // テーブル → 使用するAPI
  tables: {
    challenges: ['events.create', 'events.update', 'events.delete'],
    participations: ['participations.create', 'participations.update'],
  },
  // API → 使用する画面
  apis: {
    'events.create': ['app/(tabs)/create.tsx'],
    'events.update': ['app/edit-challenge/[id].tsx'],
  },
};
```

#### D. 管理画面の追加

1. **DB構造ビューア**: 本番DBのテーブル構造をリアルタイムで確認
2. **スキーマ比較**: コードのスキーマとDBの実際の構造を比較
3. **API一覧**: 全APIエンドポイントと使用状況を表示
4. **依存関係グラフ**: テーブル→API→画面の依存関係を可視化

#### E. テストの追加

```typescript
// tests/events.test.ts
describe('events.create', () => {
  it('should create a challenge with minimum required fields', async () => {
    const result = await trpc.events.create.mutate({
      title: 'テストチャレンジ',
      eventDate: '2026-01-20',
      hostTwitterId: '123456',
      hostName: 'テストユーザー',
    });
    expect(result.id).toBeDefined();
  });
});
```

---

## 9. GPTへの質問

1. **データベース設計について**
   - 現在の26テーブル構成は適切か？
   - AIも人間も理解しやすいテーブル設計のベストプラクティスは？
   - 非正規化（aiSummary等）はどの程度許容すべきか？

2. **コンポーネント化について**
   - 画面とAPIの依存関係を管理する良い方法は？
   - 変更時の影響範囲を最小化するための設計パターンは？

3. **既存機能を壊さないための仕組み**
   - Vercel + Railway + TiDB Cloudの3環境を同期させる方法は？
   - マイグレーション管理のベストプラクティスは？
   - 本番DBとコードの整合性を保つ方法は？
   - テスト戦略として何を優先すべきか？

4. **管理画面について**
   - どのような管理画面があると開発効率が上がるか？
   - 依存関係の可視化はどのように実装すべきか？

5. **デプロイフローについて**
   - GitHubプッシュ時にVercel/Railway/TiDBを安全に同期させる方法は？
   - ロールバック戦略はどうすべきか？

---

## 10. 添付資料

### 10.1 ファイル構造

```
birthday-celebration/  （プロジェクト名は歴史的経緯で残っている）
├── app/                    # フロントエンド画面（44画面）
│   ├── (tabs)/            # タブナビゲーション（ホーム、作成、マイページ）
│   ├── admin/             # 管理者画面
│   ├── event/             # チャレンジ詳細
│   ├── dashboard/         # 主催者ダッシュボード
│   └── ...
├── components/            # 共通コンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   └── organisms/        # 複合コンポーネント
├── drizzle/
│   └── schema.ts          # DBスキーマ定義（26テーブル）
├── server/
│   ├── routers.ts         # APIエンドポイント定義（26ルーター）
│   ├── db.ts              # データベース操作関数
│   └── _core/             # サーバーコア機能
├── shared/
│   ├── version.ts         # バージョン管理
│   └── const.ts           # 共通定数
└── docs/
    └── gpt-consultation.md # このドキュメント
```

### 10.2 技術スタック

| レイヤー | 技術 | 説明 |
|---------|------|------|
| フロントエンド | React Native (Expo) | クロスプラットフォーム対応 |
| | TypeScript | 型安全 |
| | NativeWind | Tailwind CSSベースのスタイリング |
| | Expo Router | ファイルベースルーティング |
| バックエンド | Node.js | ランタイム |
| | Express | HTTPサーバー |
| | tRPC | 型安全なAPI |
| | Drizzle ORM | 型安全なDB操作 |
| データベース | TiDB Cloud | MySQL互換の分散DB |
| ホスティング | Vercel | フロントエンド |
| | Railway | バックエンド |
| 認証 | Twitter OAuth | Twitterログイン |

### 10.3 現在のバージョン

- アプリバージョン: v5.98（v6.01で問題発生、ロールバック済み）
- 最終正常動作: 不明（チャレンジ作成がいつから失敗しているか要調査）

---

*このドキュメントは2026年1月19日時点の状態を反映しています。*
