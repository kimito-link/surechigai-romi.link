# 開発環境セットアップガイド

**最終更新**: 2026年1月30日  
**対象読者**: AI・開発者

---

## 📋 目次

1. [前提条件](#前提条件)
2. [初回セットアップ](#初回セットアップ)
3. [開発サーバーの起動](#開発サーバーの起動)
4. [開発ワークフロー](#開発ワークフロー)
5. [テストの実行](#テストの実行)
6. [コード品質チェック](#コード品質チェック)
7. [データベース操作](#データベース操作)
8. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必須ソフトウェア

以下のソフトウェアがインストールされている必要があります。

| ソフトウェア | バージョン | インストール方法 |
|-------------|-----------|----------------|
| **Node.js** | 24.x以上 | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9.12.0以上 | `npm install -g pnpm@9.12.0` |
| **Git** | 最新版 | [git-scm.com](https://git-scm.com/) |

### 推奨ソフトウェア

| ソフトウェア | 用途 |
|-------------|------|
| **Visual Studio Code** | コードエディタ |
| **GitHub CLI** | GitHubとの連携 |
| **Expo Go** | モバイルアプリのプレビュー（iOS/Android） |

---

## 初回セットアップ

### 1. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/kimito-link/doin-challenge.com.git
cd doin-challenge.com

# または、SSHでクローン
git clone git@github.com:kimito-link/doin-challenge.com.git
cd doin-challenge.com
```

### 2. 依存関係のインストール

```bash
pnpm install
```

このコマンドは以下を実行します：

- `node_modules/` ディレクトリの作成
- すべての依存関係のインストール
- `pnpm-lock.yaml` の生成（既に存在する場合はスキップ）

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します。

```bash
# .envファイルを作成
touch .env
```

`.env` ファイルに以下の内容を記述します。

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

**注意**: `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

### 4. データベースマイグレーション

```bash
pnpm db:push
```

このコマンドは以下を実行します：

- Drizzle ORMがスキーマ定義を読み込む
- データベースにテーブルを作成
- マイグレーションファイルを生成

---

## 開発サーバーの起動

### 基本的な起動方法

```bash
pnpm dev
```

このコマンドは以下を同時に起動します：

| サーバー | URL | 説明 |
|---------|-----|------|
| **バックエンドサーバー** | http://localhost:3000 | Express + tRPC API |
| **Expo Metro Bundler** | http://localhost:8081 | React Nativeバンドラー |

### 各サーバーを個別に起動する方法

```bash
# バックエンドサーバーのみ起動
pnpm dev:server

# Expo Metro Bundlerのみ起動
pnpm dev:metro
```

### 起動確認

#### バックエンドサーバーの確認

```bash
curl http://localhost:3000/api/health
```

期待される出力：

```json
{
  "status": "ok",
  "commitSha": "c541925",
  "version": "6.165"
}
```

#### Expo Metro Bundlerの確認

ブラウザで http://localhost:8081 にアクセスすると、Expoの開発画面が表示されます。

---

## 開発ワークフロー

### 1. 新しい機能の開発

```bash
# 1. 最新のコードを取得
git pull origin main

# 2. 新しいブランチを作成
git checkout -b feature/new-feature

# 3. コードを編集

# 4. 変更をコミット
git add .
git commit -m "feat: Add new feature"

# 5. GitHubにプッシュ
git push origin feature/new-feature

# 6. Pull Requestを作成
# GitHubのウェブUIで作成
```

### 2. バグ修正

```bash
# 1. 最新のコードを取得
git pull origin main

# 2. 新しいブランチを作成
git checkout -b fix/bug-fix

# 3. コードを編集

# 4. 変更をコミット
git add .
git commit -m "fix: Fix bug"

# 5. GitHubにプッシュ
git push origin fix/bug-fix

# 6. Pull Requestを作成
# GitHubのウェブUIで作成
```

### 3. デプロイ

```bash
# デプロイスクリプトを実行
./scripts/deploy-to-production.sh "デプロイメッセージ"
```

詳細は `deployment-guide.md` を参照してください。

---

## テストの実行

### ユニットテスト

```bash
# 全テスト実行
pnpm test

# 特定のテスト実行
pnpm test path/to/test.test.ts

# ウォッチモード
pnpm test --watch
```

### E2Eテスト

```bash
# E2Eテスト実行
pnpm e2e

# E2EテストUI表示
pnpm e2e:ui

# 特定のブラウザでE2Eテスト実行
pnpm e2e --project=chromium
```

### テストカバレッジ

```bash
# カバレッジレポート生成
pnpm test --coverage
```

---

## コード品質チェック

### TypeScript型チェック

```bash
pnpm check
```

このコマンドは以下を実行します：

- TypeScriptコンパイラが型エラーをチェック
- エラーがある場合は終了コード1で終了

### ESLint

```bash
# ESLint実行
pnpm lint

# ESLint自動修正
pnpm lint --fix
```

### Prettier

```bash
# Prettierフォーマット
pnpm format

# Prettierチェック（フォーマットせずに確認のみ）
pnpm format --check
```

---

## データベース操作

### スキーマ変更の生成とマイグレーション

```bash
# スキーマ変更を生成してマイグレーション実行
pnpm db:push
```

このコマンドは以下を実行します：

1. `server/db/schema.ts` を読み込む
2. 現在のデータベーススキーマと比較
3. 差分を検出してマイグレーションファイルを生成
4. マイグレーションを実行

### マイグレーション実行

```bash
# マイグレーション実行のみ
pnpm db:migrate
```

### データベース接続確認

```bash
# PostgreSQLに接続
psql $DATABASE_URL
```

---

## トラブルシューティング

### 問題1: `pnpm install` が失敗する

**原因**: Node.jsのバージョンが古い、またはpnpmのバージョンが古い

**解決策**:

```bash
# Node.jsのバージョン確認
node --version  # 24.x以上であることを確認

# pnpmのバージョン確認
pnpm --version  # 9.12.0以上であることを確認

# pnpmを最新版に更新
npm install -g pnpm@9.12.0
```

### 問題2: 開発サーバーが起動しない

**原因**: ポート3000または8081が既に使用されている

**解決策**:

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# ポート8081を使用しているプロセスを確認
lsof -i :8081

# プロセスを終了
kill -9 <PID>
```

### 問題3: データベース接続エラー

**原因**: `DATABASE_URL` が正しく設定されていない

**解決策**:

```bash
# .envファイルを確認
cat .env

# DATABASE_URLが正しいか確認
echo $DATABASE_URL

# PostgreSQLに接続できるか確認
psql $DATABASE_URL
```

### 問題4: TypeScript型エラー

**原因**: 型定義が古い、または依存関係が不足している

**解決策**:

```bash
# node_modulesを削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install

# TypeScript型チェック
pnpm check
```

### 問題5: Expo Metro Bundlerが起動しない

**原因**: キャッシュが破損している

**解決策**:

```bash
# Expoキャッシュをクリア
npx expo start --clear

# または、手動でキャッシュを削除
rm -rf .expo node_modules/.cache
```

---

## 便利なコマンド一覧

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（バックエンド + Expo） |
| `pnpm dev:server` | バックエンドサーバーのみ起動 |
| `pnpm dev:metro` | Expo Metro Bundlerのみ起動 |
| `pnpm test` | ユニットテスト実行 |
| `pnpm e2e` | E2Eテスト実行 |
| `pnpm check` | TypeScript型チェック |
| `pnpm lint` | ESLint実行 |
| `pnpm format` | Prettierフォーマット |
| `pnpm db:push` | スキーマ変更の生成とマイグレーション |
| `pnpm db:migrate` | マイグレーション実行 |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |

---

## 次のステップ

- **アーキテクチャを理解する**: `docs/ARCHITECTURE.md` を参照
- **デプロイ方法を学ぶ**: `docs/deployment-guide.md` を参照
- **品質基準を確認する**: `docs/gate1.md` を参照
