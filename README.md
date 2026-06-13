# 君斗りんくの動員ちゃれんじ

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**ドメイン**: [doin-challenge.com](https://doin-challenge.com)  
**バージョン**: 6.165  
**最終更新**: 2026年1月30日

---

## 🚨 最重要：デプロイ方法（AI・人間共通）

### デプロイの3つの方法

| 方法 | コマンド/手順 | 所要時間 |
|------|--------------|---------|
| **1. Manusから** | `./scripts/deploy-to-production.sh "コミットメッセージ"` | 5-10分 |
| **2. スマホから** | GitHubアプリ → Actions → "Manual Deploy" → "Run workflow" | 5-10分 |
| **3. PCから** | GitHubウェブ → Actions → "Manual Deploy" → "Run workflow" | 5-10分 |

### デプロイ後の確認方法

1. **GitHub Actions**: https://github.com/kimito-link/doin-challenge.com/actions
   - 最新のワークフローが緑のチェックマーク（成功）になるまで待つ
   - 通常5-10分かかる

2. **本番環境**: https://doin-challenge.com
   - シークレットモードでアクセス
   - バージョン番号が更新されているか確認

3. **Health Check API**: https://doin-challenge.com/api/health
   - `commitSha`が最新のコミットハッシュと一致しているか確認

### トラブルシューティング

- **ワークフローが失敗した場合**: `docs/deployment-guide.md` を参照
- **バージョンが更新されない場合**: GitHub Actionsのログを確認
- **詳細な手順**: `docs/deployment-guide.md` を参照

---

## ⚠️ AIへの重要な指示（セッション開始時に必ず読むこと）

### 📋 作業開始時のチェックリスト

1. ✅ 最新の `docs/chatlog-YYYYMMDD.md` を読む（過去の作業内容を確認）
2. ✅ `todo.md` で未完了タスクを確認
3. ✅ mdファイルに書かれていることを忠実に実行（勝手に仕様を拡大しない）
4. ✅ ユーザーが「何度も言った」と言ったら、chatlogを確認する

### 🔴 絶対に忘れてはいけないこと

- **デプロイ**: `./scripts/deploy-to-production.sh` で実行（手動git pushは不要）
- **GitHubアプリ**: スマホにもインストール済み（Workflow Dispatchが使える）
- **本番環境**: doin-challenge.com（デプロイ後5-10分で反映）
- **リポジトリ**: https://github.com/kimito-link/doin-challenge.com

### 📚 重要なドキュメント

| ファイル | 内容 | 優先度 |
|---------|------|--------|
| `docs/chatlog-YYYYMMDD.md` | 過去の作業ログ（必ず読む） | 🔴 最高 |
| `docs/deployment-guide.md` | デプロイ手順の詳細 | 🔴 最高 |
| `docs/development-guide.md` | 開発環境のセットアップ | 🟡 高 |
| `docs/ARCHITECTURE.md` | アーキテクチャの説明 | 🟢 中 |
| `docs/gate1.md` | 本番環境の品質基準 | 🔴 最高 |
| `todo.md` | 未完了タスク一覧 | 🔴 最高 |

---

## 📖 プロジェクト概要

**動員チャレンジ**は、アイドル・ホスト・キャバ嬢などのエンターテイナーの生誕祭やイベントを応援するためのWebアプリケーションです。

### 主要機能

| 機能 | 説明 |
|------|------|
| **Twitter OAuth認証** | Twitter OAuth 2.0 with PKCEによる安全なログイン |
| **フォロワー数表示** | ログインユーザーのTwitterフォロワー数をリアルタイム表示 |
| **応援メッセージ投稿** | ファンからの応援メッセージを収集・表示 |
| **参加登録機能** | イベントへの参加表明と都道府県別の可視化 |
| **統計ダッシュボード** | ユーザー統計・管理者統計の表示 |

---

## 🛠️ 技術スタック

### フロントエンド

- **React** 19.1.0 - UIライブラリ
- **React Native** 0.81.5 - モバイルアプリケーションフレームワーク
- **Expo** ~54.0.29 - React Nativeの開発環境・ビルドツール
- **NativeWind** ^4.2.1 - Tailwind CSSのReact Native実装
- **TypeScript** ~5.9.3 - 型安全性の確保

### バックエンド

- **Node.js** 24.x - サーバーランタイム
- **Express** ^4.22.1 - Webフレームワーク
- **tRPC** 11.7.2 - 型安全なAPIエンドポイント
- **Drizzle ORM** ^0.44.7 - データベースORM
- **PostgreSQL** - リレーショナルデータベース

### ビルド・デプロイ

- **pnpm** 9.12.0 - パッケージマネージャー
- **esbuild** - サーバーサイドバンドラー
- **Railway** - バックエンドホスティング
- **Vercel** - フロントエンドホスティング
- **GitHub Actions** - CI/CDパイプライン

---

## 📁 プロジェクト構造

```
birthday-celebration/
├── app/                      # Expo Routerアプリケーション
│   ├── (tabs)/              # タブナビゲーション画面
│   ├── event/               # イベント関連画面
│   └── oauth/               # OAuth認証コールバック
├── components/              # 再利用可能なUIコンポーネント
├── features/                # 機能別コンポーネント
│   ├── onboarding/          # オンボーディング
│   ├── mypage/              # マイページ
│   ├── create/              # イベント作成
│   └── event/               # イベント詳細
├── hooks/                   # カスタムReactフック
├── lib/                     # ユーティリティ・共通ロジック
├── server/                  # バックエンドサーバー
│   ├── _core/               # サーバーコア
│   ├── routers/             # tRPCルーター
│   └── db/                  # データベーススキーマ
├── shared/                  # クライアント・サーバー共通型定義
├── docs/                    # ドキュメント
├── scripts/                 # ビルド・デプロイスクリプト
├── .github/workflows/       # GitHub Actions
└── assets/                  # 静的アセット（画像・フォント）
```

詳細は `docs/architecture.md` を参照してください。

---

## 🚀 クイックスタート

### 前提条件

- **Node.js**: 24.x以上
- **pnpm**: 9.12.0以上
- **Git**: 最新版

### 1. リポジトリのクローン

```bash
git clone https://github.com/kimito-link/doin-challenge.com.git
cd doin-challenge.com
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の環境変数を設定します。

```env
# データベース接続（Railway提供）
DATABASE_URL=postgresql://user:password@host:port/database

# Twitter OAuth 2.0認証情報
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_CALLBACK_URL=https://doin-challenge.com/oauth/callback

# セッション管理
SESSION_SECRET=your_random_session_secret

# Expo設定
EXPO_PORT=8081
```

### 4. 開発サーバーの起動

```bash
pnpm dev
```

このコマンドは以下を同時に起動します：

- **バックエンドサーバー**: `http://localhost:3000`
- **Expo Metro Bundler**: `http://localhost:8081`

詳細は `docs/development-guide.md` を参照してください。

---

## 📚 ドキュメント一覧

| ドキュメント | 内容 | 対象読者 |
|-------------|------|---------|
| [deployment-guide.md](./docs/deployment-guide.md) | デプロイ手順の詳細 | AI・開発者 |
| [development-guide.md](./docs/development-guide.md) | 開発環境のセットアップ | AI・開発者 |
| [architecture.md](./docs/architecture.md) | アーキテクチャの説明 | AI・開発者 |
| [gate1.md](./docs/gate1.md) | 本番環境の品質基準 | AI・開発者 |
| [visibility-issues.md](./docs/visibility-issues.md) | 視認性問題の修正履歴 | 開発者 |
| [chatlog-YYYYMMDD.md](./docs/chatlog-YYYYMMDD.md) | 作業ログ | AI・開発者 |
| [todo.md](./todo.md) | 未完了タスク一覧 | AI・開発者 |

---

## 🤝 コントリビューション

このプロジェクトは、Manus AIによって開発されています。

---

## 📄 ライセンス

MIT License

---

## 📞 サポート

- **リポジトリ**: https://github.com/kimito-link/doin-challenge.com
- **本番環境**: https://doin-challenge.com
- **Health Check API**: https://doin-challenge.com/api/health
