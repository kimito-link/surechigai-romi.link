# トラブルシューティングガイド

**プロジェクト名**: 動員チャレンジ（Doin Challenge）  
**バージョン**: 6.144  
**最終更新**: 2026年1月29日  
**作成者**: Manus AI

---

## 概要

本ドキュメントは「動員チャレンジ」アプリケーションでよく発生する問題と、その解決方法を記述したものです。開発環境、デプロイ環境、本番環境での問題を網羅的にカバーしています。

---

## 目次

1. [バージョン情報の問題](#バージョン情報の問題)
2. [デプロイの問題](#デプロイの問題)
3. [認証の問題](#認証の問題)
4. [データベースの問題](#データベースの問題)
5. [ビルドの問題](#ビルドの問題)
6. [ローカル開発の問題](#ローカル開発の問題)
7. [テストの問題](#テストの問題)

---

## バージョン情報の問題

### 問題1: `/api/health`が`"version": "unknown"`を返す

**症状**:

```bash
$ curl https://doin-challenge.com/api/health
{
  "ok": true,
  "version": "unknown",
  "commitSha": "unknown",
  "gitSha": "unknown",
  "builtAt": "unknown"
}
```

**原因**:

本アプリケーションは、以下の優先順位でバージョン情報を取得します：

1. **RAILWAY_GIT_COMMIT_SHA**環境変数（Railwayが自動設定）
2. **build-info.json**ファイル（ビルド時に生成）
3. **"unknown"**（上記が取得できない場合）

`"version": "unknown"`が返される場合、以下のいずれかが原因です：

- `RAILWAY_GIT_COMMIT_SHA`環境変数が設定されていない
- `build-info.json`ファイルが存在しない、または読み込めない
- ビルドプロセスが正しく実行されていない

**解決方法**:

#### ステップ1: Railwayの環境変数を確認

1. Railwayダッシュボードにログイン
2. プロジェクト「doin-challenge」を選択
3. 「Variables」タブを開く
4. `RAILWAY_GIT_COMMIT_SHA`が存在することを確認

**注意**: `RAILWAY_GIT_COMMIT_SHA`は、Railwayが自動的に設定する環境変数です。手動で設定する必要はありません。

#### ステップ2: ビルドログを確認

1. Railwayダッシュボードで「Deployments」タブを開く
2. 最新のデプロイメントを選択
3. ビルドログで以下を確認：

```
=== build-info (server/_core) ===
{"commitSha":"ea51793...","gitSha":"ea51793...","builtAt":"2026-01-28T09:04:00Z",...}

[pnpm build]
...

=== build-info (dist) ===
{"commitSha":"ea51793...","gitSha":"ea51793...","builtAt":"2026-01-28T09:04:00Z",...}
```

`build-info.json`が正しく生成されていない場合、カスタムビルドコマンドを確認してください。

#### ステップ3: カスタムビルドコマンドを確認

Railwayの「Settings」→「Build」で以下のコマンドが設定されていることを確認：

```bash
set -eux && echo "PWD=$(pwd)" && ls -la && rm -rf server/_core/build-info.json dist/build-info.json && pnpm install && pnpm db:migrate && mkdir -p server/_core && COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "railway-$(date +%s)") && echo "{\"commitSha\":\"$COMMIT_SHA\",\"gitSha\":\"$COMMIT_SHA\",\"builtAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"version\":\"$COMMIT_SHA\",\"buildTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > server/_core/build-info.json && echo "=== build-info (server/_core) ===" && cat server/_core/build-info.json || true && pnpm build && echo "=== build-info (dist) ===" && cat dist/build-info.json || true
```

#### ステップ4: 再デプロイ

1. Railwayダッシュボードで「Deployments」タブを開く
2. 「Redeploy」ボタンをクリック
3. デプロイ完了後、再度`/api/health`を確認

```bash
$ curl https://doin-challenge.com/api/health
{
  "ok": true,
  "version": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "commitSha": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "gitSha": "ea51793dcf09d6d347432389afe6d1c4cbfce5f1",
  "builtAt": "2026-01-28T09:04:00Z",
  "nodeEnv": "production"
}
```

### 問題2: Vercelで`build-info.json`が読み込めない

**症状**:

Vercelデプロイ後、フロントエンドでバージョン情報が表示されない。

**原因**:

Vercelのビルドプロセスで`build-info.json`が`dist/`ディレクトリにコピーされていない。

**解決方法**:

GitHub Actionsの`.github/workflows/deploy-vercel.yml`で以下が実行されていることを確認：

```yaml
- name: Generate build-info.json
  run: |
    mkdir -p server/_core
    cat > server/_core/build-info.json << EOF
    {
      "commitSha": "${{ github.sha }}",
      "gitSha": "${{ github.sha }}",
      "builtAt": "${{ github.event.head_commit.timestamp }}",
      "version": "${{ github.sha }}",
      "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
    EOF
    mkdir -p dist
    cp server/_core/build-info.json dist/build-info.json
```

---

## デプロイの問題

### 問題3: GitHub Actionsが失敗する

**症状**:

GitHub Actionsの「Deploy to Vercel」ワークフローが失敗する。

**原因**:

- GitHub Secretsが設定されていない
- Vercel APIトークンが無効
- 依存関係のインストールに失敗

**解決方法**:

#### ステップ1: GitHub Secretsを確認

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」を開く
2. 以下のシークレットが設定されていることを確認：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

#### ステップ2: Vercel APIトークンを再生成

1. Vercelダッシュボードで「Settings」→「Tokens」を開く
2. 新しいトークンを生成
3. GitHubの`VERCEL_TOKEN`シークレットを更新

#### ステップ3: ワークフローログを確認

1. GitHubリポジトリの「Actions」タブを開く
2. 失敗したワークフローを選択
3. エラーメッセージを確認

### 問題4: Railwayデプロイが失敗する

**症状**:

Railwayのデプロイが「Failed」ステータスになる。

**原因**:

- ビルドコマンドが失敗
- データベースマイグレーションが失敗
- 環境変数が不足

**解決方法**:

#### ステップ1: デプロイログを確認

1. Railwayダッシュボードで「Deployments」タブを開く
2. 失敗したデプロイメントを選択
3. ログでエラーメッセージを確認

#### ステップ2: 環境変数を確認

「Variables」タブで以下の環境変数が設定されていることを確認：

- `DATABASE_URL`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_CALLBACK_URL`
- `SESSION_SECRET`

#### ステップ3: データベース接続を確認

```bash
# ローカルから接続テスト
psql $DATABASE_URL -c "SELECT 1;"
```

---

## 認証の問題

### 問題5: Twitter OAuth認証が失敗する

**症状**:

ログインボタンをクリックすると、Twitterの認証画面に遷移するが、コールバック時にエラーが発生する。

**原因**:

- `TWITTER_CALLBACK_URL`が正しくない
- Twitter Developer Portalで許可されたコールバックURLが設定されていない
- `code_verifier`が失われている

**解決方法**:

#### ステップ1: コールバックURLを確認

Railwayの環境変数で`TWITTER_CALLBACK_URL`が以下のように設定されていることを確認：

```
TWITTER_CALLBACK_URL=https://doin-challenge.com/oauth/callback
```

#### ステップ2: Twitter Developer Portalを確認

1. [Twitter Developer Portal](https://developer.twitter.com/)にログイン
2. アプリケーションを選択
3. 「Settings」→「Authentication settings」で以下を確認：
   - **Callback URLs**: `https://doin-challenge.com/oauth/callback`が登録されている
   - **Website URL**: `https://doin-challenge.com`が設定されている

#### ステップ3: セッションCookieを確認

ブラウザの開発者ツールで、`oauth_state`と`code_verifier`のCookieが設定されていることを確認。

### 問題6: ログイン後にユーザー情報が表示されない

**症状**:

ログインは成功するが、ユーザー情報（フォロワー数など）が表示されない。

**原因**:

- Twitter APIのスコープが不足している
- トークンが無効

**解決方法**:

#### ステップ1: OAuth 2.0スコープを確認

`server/twitter-oauth2.ts`で以下のスコープが設定されていることを確認：

```typescript
const scopes = [
  "tweet.read",
  "users.read",
  "follows.read",
  "offline.access"
];
```

#### ステップ2: トークンを再取得

1. ログアウト
2. 再度ログイン
3. Twitterの認証画面で「許可する」をクリック

---

## データベースの問題

### 問題7: データベース接続エラー

**症状**:

サーバーが起動しない、または`ECONNREFUSED`エラーが発生する。

**原因**:

- `DATABASE_URL`が正しくない
- PostgreSQLサービスが停止している
- ファイアウォールがブロックしている

**解決方法**:

#### ステップ1: DATABASE_URLを確認

Railwayダッシュボードで「PostgreSQL」サービスを選択し、「Connect」タブで接続情報を確認。

#### ステップ2: PostgreSQLサービスのステータスを確認

Railwayダッシュボードで「PostgreSQL」サービスが「Running」ステータスになっていることを確認。

#### ステップ3: ローカルから接続テスト

```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 問題8: マイグレーションが失敗する

**症状**:

`pnpm db:migrate`が失敗する。

**原因**:

- スキーマファイルに構文エラーがある
- データベースに既存のテーブルが存在する

**解決方法**:

#### ステップ1: スキーマファイルを確認

`server/db/schema.ts`に構文エラーがないか確認。

#### ステップ2: マイグレーション履歴を確認

```bash
# マイグレーション履歴を表示
psql $DATABASE_URL -c "SELECT * FROM drizzle_migrations;"
```

#### ステップ3: マイグレーションを再実行

```bash
# ローカルでマイグレーション
pnpm db:migrate
```

---

## ビルドの問題

### 問題9: esbuildが失敗する

**症状**:

`pnpm build`が失敗する。

**原因**:

- TypeScriptの型エラー
- 依存関係の不足
- esbuildの設定ミス

**解決方法**:

#### ステップ1: TypeScript型チェック

```bash
pnpm check
```

型エラーがある場合は修正。

#### ステップ2: 依存関係を再インストール

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### ステップ3: ビルドコマンドを確認

`package.json`の`build`スクリプトが以下のようになっていることを確認：

```json
"build": "node scripts/generate-build-info.cjs && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist && cp -v server/_core/build-info.json dist/build-info.json"
```

### 問題10: `build-info.json`が生成されない

**症状**:

ビルド後、`dist/build-info.json`が存在しない。

**原因**:

- `scripts/generate-build-info.cjs`が実行されていない
- `cp`コマンドが失敗している

**解決方法**:

#### ステップ1: prebuildスクリプトを確認

`package.json`の`scripts`セクションに以下が含まれていることを確認：

```json
"build": "node scripts/generate-build-info.cjs && esbuild ... && cp -v server/_core/build-info.json dist/build-info.json"
```

#### ステップ2: 手動で生成

```bash
node scripts/generate-build-info.cjs
ls -la server/_core/build-info.json
```

#### ステップ3: ビルドログを確認

```bash
pnpm build
```

`cp -v`の出力で`'server/_core/build-info.json' -> 'dist/build-info.json'`が表示されることを確認。

---

## ローカル開発の問題

### 問題11: 開発サーバーが起動しない

**症状**:

`pnpm dev`が失敗する。

**原因**:

- ポート3000または8081が既に使用されている
- 環境変数が設定されていない
- 依存関係が不足している

**解決方法**:

#### ステップ1: ポートを確認

```bash
# ポート3000を使用しているプロセスを確認
lsof -i :3000

# ポート8081を使用しているプロセスを確認
lsof -i :8081

# プロセスを終了
kill -9 <PID>
```

#### ステップ2: 環境変数を確認

プロジェクトルートに`.env`ファイルが存在し、以下の環境変数が設定されていることを確認：

```env
DATABASE_URL=postgresql://...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_CALLBACK_URL=http://localhost:3000/oauth/callback
SESSION_SECRET=...
EXPO_PORT=8081
```

#### ステップ3: 依存関係を再インストール

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 問題12: Expo Metro Bundlerが遅い

**症状**:

Expo Metro Bundlerのビルドが非常に遅い。

**原因**:

- キャッシュが肥大化している
- ファイル監視が多すぎる

**解決方法**:

#### ステップ1: キャッシュをクリア

```bash
# Expoキャッシュをクリア
npx expo start --clear

# Metro Bundlerキャッシュをクリア
rm -rf .expo node_modules/.cache
```

#### ステップ2: ファイル監視を最適化

`.watchmanconfig`ファイルを作成：

```json
{
  "ignore_dirs": ["node_modules", ".git", "dist"]
}
```

---

## テストの問題

### 問題13: Vitestが失敗する

**症状**:

`pnpm test`が失敗する。

**原因**:

- モックが正しく設定されていない
- Expo環境のモックが不完全

**解決方法**:

#### ステップ1: テストログを確認

```bash
pnpm test --reporter=verbose
```

#### ステップ2: モック設定を確認

`vitest.setup.ts`で以下のモックが設定されていることを確認：

```typescript
vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: "http://localhost:3000"
      }
    }
  }
}));
```

#### ステップ3: 特定のテストを実行

```bash
pnpm test path/to/test.test.ts
```

### 問題14: E2Eテストが失敗する

**症状**:

`pnpm e2e`が失敗する。

**原因**:

- 開発サーバーが起動していない
- ブラウザが起動しない

**解決方法**:

#### ステップ1: 開発サーバーを起動

```bash
pnpm dev
```

#### ステップ2: Playwrightブラウザをインストール

```bash
npx playwright install
```

#### ステップ3: E2Eテストを再実行

```bash
pnpm e2e
```

---

## その他の問題

### 問題15: WebSocketが接続できない

**症状**:

リアルタイム通知が動作しない。

**原因**:

- WebSocketサーバーが起動していない
- ファイアウォールがブロックしている

**解決方法**:

#### ステップ1: WebSocketサーバーのログを確認

```bash
# Railwayのデプロイログを確認
# "WebSocket server started on port 3000"が表示されることを確認
```

#### ステップ2: WebSocket接続をテスト

```bash
# wscat（WebSocketクライアント）をインストール
npm install -g wscat

# WebSocket接続をテスト
wscat -c wss://doin-challenge.com
```

### 問題16: パフォーマンスが遅い

**症状**:

アプリケーションの動作が遅い。

**原因**:

- データベースクエリが最適化されていない
- キャッシュが有効になっていない

**解決方法**:

#### ステップ1: データベースクエリを最適化

Drizzle ORMのクエリログを確認：

```typescript
// server/db.ts
export const db = drizzle(pool, {
  schema,
  logger: true // クエリログを有効化
});
```

#### ステップ2: キャッシュを有効化

TanStack Queryのキャッシュ設定を確認：

```typescript
// lib/trpc.ts
export const trpc = createTRPCReact<AppRouter>({
  overrides: {
    useMutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      }
    }
  }
});
```

---

## サポート

上記の解決方法で問題が解決しない場合は、以下の情報を含めてIssueを作成してください：

- **症状**: 何が起こっているか
- **環境**: ローカル開発環境、Railway、Vercel
- **エラーメッセージ**: 完全なエラーログ
- **再現手順**: 問題を再現する手順
- **期待される動作**: 本来どうあるべきか

---

## 参考資料

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/overview/)
- [tRPC Error Handling](https://trpc.io/docs/error-handling)
