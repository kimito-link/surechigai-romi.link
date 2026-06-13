# クリエイター動員支援アプリ（doin-challenge） - 設計ドキュメント

## コンセプト

**クリエイターの動員・ファンエンゲージメントを支援するモバイルアプリ**

**主なユースケース**：
- アイドル・アーティストのライブ動員
- クリエイターの作品リリース告知・応援募集
- 配信者のイベント参加呼びかけ
- ホスト・キャバ嬢などへの応用も可能

クリエイターがライブ・配信・SNSなどの目標達成をファンと一緒にチャレンジするアプリ。

## 対応する目標タイプ

| タイプ | 単位 | 用途例 |
|--------|------|--------|
| 動員 | 人 | ライブ・イベント参加者 |
| フォロワー | 人 | Twitter/Instagram等のフォロワー増加 |
| 同時視聴 | 人 | YouTubeプレミア・配信の同接 |
| 応援ポイント | pt | ミクチャ等のイベント |
| カスタム | 自由 | その他の目標 |

## 画面構成（モバイルポートレート 9:16）

### 1. ホーム画面（チャレンジ一覧）
- ヘッダー: ロゴ + キャラクター
- フィルター: タイプ（すべて/グループ/ソロ）、地域
- チャレンジカード一覧（グリッド2列）
  - タイプバッジ（ソロ/グループ）
  - チャレンジ名
  - 主催者名
  - 現在人数 / 目標人数
  - 達成率 %
  - 会場・日付

### 2. チャレンジ詳細画面
- ヘッダー画像（グラデーション背景）
- 主催者情報（アイコン・名前・フォロワー数）
- 進捗セクション
  - 大きな数字: 「7 / 150人」
  - 進捗バー
  - 「あと143人で目標達成！」
  - グリッド表示（参加者をマス目で可視化）
- チケット情報（任意）
- 地域別マップ
  - 北海道・東北、関東、中部、近畿、中国・四国、九州・沖縄
  - 都道府県ごとの参加人数
- 応援メッセージ一覧
- 参加表明ボタン

### 3. 参加表明フォーム
- お名前（ニックネーム）
- Twitterユーザー名（任意）
- 応援メッセージ（任意）
- 友人追加セクション
  - 「友達を何人連れて行きますか？」
  - 人数選択
- 都道府県選択
- 参加表明ボタン

### 4. チャレンジ作成画面
- 目標タイプ選択
- チャレンジ名
- 目標数値
- 期間（開始日・終了日）
- 会場/URL
- チケット情報（任意）
- 説明文

### 5. マイページ
- プロフィール情報
- 参加中のチャレンジ一覧（貢献度付き）
- 主催したチャレンジ一覧
- 貢献度履歴

## カラーパレット
- プライマリ: #00427B（KimitoLinkブルー）
- アクセント: #DD6500（KimitoLinkオレンジ）
- 進捗グラデーション: ピンク → パープル (#EC4899 → #8B5CF6)
- 背景: ダークテーマ（#0D1117）

## キャラクター
- ゆっくりりんく: メインキャラ、ヘッドホン
- ゆっくりこん太: きつね耳、元気
- ゆっくりたぬ姉: たぬき耳、しっかり者

## データ構造

### Challenge（チャレンジ）
- id: string
- hostId: string
- hostName: string
- hostUsername: string
- hostProfileImage: string
- hostFollowersCount: number
- title: string
- description: string
- goalType: 'attendance' | 'followers' | 'viewers' | 'points' | 'custom'
- goalValue: number
- goalUnit: string
- currentValue: number
- eventType: 'solo' | 'group'
- eventDate: Date
- venue: string
- prefecture: string
- ticketInfo: { presale: number, door: number, saleStart: Date } | null
- status: 'upcoming' | 'active' | 'ended'
- createdAt: Date

### Participation（参加登録）
- id: string
- challengeId: string
- userId: string | null
- displayName: string
- twitterUsername: string | null
- profileImage: string | null
- message: string
- companionCount: number
- prefecture: string
- contribution: number
- createdAt: Date
