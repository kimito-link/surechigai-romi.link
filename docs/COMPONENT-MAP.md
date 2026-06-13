# コンポーネント構成図

**最終更新**: 2026年1月15日  
**バージョン**: 4.53  
**作成者**: Manus AI

---

## 概要

本ドキュメントは「君斗りんく動員ちゃれんじ」アプリのコンポーネント構成を可視化したものである。各コンポーネントの役割と依存関係を明確にし、改修時の影響範囲を把握しやすくする。

---

## 画面コンポーネント一覧

アプリの画面は`app/`ディレクトリに配置されており、Expo Routerによってファイルベースルーティングが適用される。

### タブ画面（メインナビゲーション）

| ファイル | 画面名 | 役割 |
|---------|--------|------|
| `app/(tabs)/index.tsx` | ホーム | チャレンジ一覧、進行中イベント表示 |
| `app/(tabs)/create.tsx` | 作成 | 新規チャレンジ作成フォーム |
| `app/(tabs)/mypage.tsx` | マイページ | ユーザー情報、設定へのリンク |

### 詳細画面

| ファイル | 画面名 | 役割 |
|---------|--------|------|
| `app/event/[id].tsx` | イベント詳細 | チャレンジ詳細、参加ボタン |
| `app/dashboard/[id].tsx` | ダッシュボード | 主催者向け統計・管理 |
| `app/profile/[userId].tsx` | プロフィール | ユーザープロフィール表示 |
| `app/achievement/[id].tsx` | アチーブメント詳細 | 獲得バッジの詳細 |

### 設定・管理画面

| ファイル | 画面名 | 役割 |
|---------|--------|------|
| `app/notification-settings.tsx` | 通知設定 | プッシュ通知のオン/オフ |
| `app/theme-settings.tsx` | テーマ設定 | ダークモード切り替え |
| `app/admin/api-usage.tsx` | API使用量 | Twitter APIレート制限確認 |
| `app/manage-comments/[id].tsx` | コメント管理 | 応援メッセージの管理 |

### 認証関連

| ファイル | 画面名 | 役割 |
|---------|--------|------|
| `app/oauth/callback.tsx` | OAuthコールバック | 認証完了処理 |
| `app/oauth/twitter-callback.tsx` | Twitterコールバック | Twitter認証完了処理 |
| `app/logout.tsx` | ログアウト | セッション終了処理 |

---

## UIコンポーネント階層

再利用可能なUIコンポーネントは`components/`ディレクトリに配置されている。

```
components/
├── 基盤コンポーネント
│   ├── screen-container.tsx      # SafeArea対応のスクリーンラッパー
│   ├── themed-view.tsx           # テーマ対応のView
│   └── pressable-card.tsx        # タップ可能なカード
│
├── チャレンジ関連
│   ├── challenge-card.tsx        # チャレンジカード表示
│   ├── challenge-progress.tsx    # 進捗バー
│   ├── participation-button.tsx  # 参加ボタン
│   └── countdown-timer.tsx       # カウントダウン表示
│
├── 可視化コンポーネント
│   ├── japan-deformed-map.tsx    # 日本地図ヒートマップ
│   ├── growth-trajectory-chart.tsx # 成長軌跡グラフ
│   ├── participant-ranking.tsx   # 参加者ランキング
│   ├── hourly-heatmap.tsx        # 時間帯別ヒートマップ
│   └── contribution-ranking.tsx  # 貢献ランキング
│
├── ユーザー関連
│   ├── user-avatar.tsx           # ユーザーアバター
│   ├── user-profile-card.tsx     # プロフィールカード
│   └── follower-badge.tsx        # フォロワーバッジ
│
├── フォーム・入力
│   ├── prefecture-picker.tsx     # 都道府県選択
│   ├── date-time-picker.tsx      # 日時選択
│   └── comment-input.tsx         # コメント入力
│
├── フィードバック
│   ├── skeleton-loader.tsx       # ローディングスケルトン
│   ├── optimized-image.tsx       # 最適化画像
│   ├── offline-banner.tsx        # オフライン通知
│   └── login-success-modal.tsx   # ログイン成功モーダル
│
└── UI部品
    ├── ui/icon-symbol.tsx        # アイコン
    ├── hoverable-button.tsx      # ホバー対応ボタン
    └── export-button.tsx         # エクスポートボタン
```

---

## コンポーネント依存関係

主要コンポーネントの依存関係を示す。

### イベント詳細画面の依存関係

```
app/event/[id].tsx
├── components/screen-container.tsx
├── components/challenge-card.tsx
│   ├── components/challenge-progress.tsx
│   ├── components/countdown-timer.tsx
│   └── components/user-avatar.tsx
├── components/participation-button.tsx
│   └── components/prefecture-picker.tsx
├── components/japan-deformed-map.tsx
├── components/participant-ranking.tsx
│   └── components/user-avatar.tsx
├── components/comment-input.tsx
└── hooks/use-auth.ts
```

### ダッシュボード画面の依存関係

```
app/dashboard/[id].tsx
├── components/screen-container.tsx
├── components/growth-trajectory-chart.tsx
├── components/hourly-heatmap.tsx
├── components/participant-ranking.tsx
├── components/japan-deformed-map.tsx
├── components/export-button.tsx
│   └── lib/export-stats.ts
└── hooks/use-auth.ts
```

---

## フック（Hooks）一覧

カスタムフックは`hooks/`ディレクトリに配置されている。

| ファイル | 役割 | 使用箇所 |
|---------|------|---------|
| `use-auth.ts` | 認証状態管理 | 全画面 |
| `use-colors.ts` | テーマカラー取得 | 全コンポーネント |
| `use-color-scheme.ts` | ダークモード検出 | ThemeProvider |
| `use-auto-login.ts` | 自動ログイン | _layout.tsx |
| `use-notification-triggers.ts` | マイルストーン検出 | イベント詳細 |

---

## ライブラリ（Lib）一覧

共通ユーティリティは`lib/`ディレクトリに配置されている。

| ファイル | 役割 | 使用箇所 |
|---------|------|---------|
| `trpc.ts` | API クライアント | 全画面 |
| `utils.ts` | 汎用ユーティリティ（cn関数） | 全コンポーネント |
| `offline-cache.ts` | オフラインキャッシュ | データ取得時 |
| `push-notifications.ts` | プッシュ通知 | 通知送信時 |
| `token-manager.ts` | トークン管理 | 認証関連 |
| `export-stats.ts` | 統計エクスポート | ダッシュボード |
| `share.ts` | SNSシェア | シェアボタン |
| `theme-provider.tsx` | テーマ管理 | _layout.tsx |

---

## コンポーネント設計原則

本アプリのコンポーネント設計は以下の原則に基づいている。

1. **単一責任の原則**: 各コンポーネントは1つの役割のみを持つ
2. **再利用性**: 汎用コンポーネントは`components/`に配置し、複数画面で共有
3. **Props Drilling回避**: 深いネストはContext APIまたはフックで解決
4. **型安全性**: すべてのPropsにTypeScript型定義を付与
5. **アクセシビリティ**: accessibilityLabel、accessibilityRoleを設定

---

## 改修時の影響範囲チェックリスト

コンポーネントを改修する際は、以下を確認すること：

- [ ] 該当コンポーネントを使用している画面を特定したか
- [ ] Props変更時、すべての使用箇所を更新したか
- [ ] 型定義を更新したか
- [ ] テストを追加/更新したか
- [ ] ドキュメントを更新したか
