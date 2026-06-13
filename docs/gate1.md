# Gate 1: 壊れない／戻せる運用

このドキュメントは、**Gate 1（壊れない／戻せる）** の原則と具体的なチェック項目をまとめたものです。

## Gate 1の目的

1. **壊れない**: デプロイ前に問題を検知し、本番環境を壊さない
2. **戻せる**: 問題が発生した場合、迅速にロールバックできる
3. **気づける**: 問題が発生した場合、迅速に検知できる

---

## 必須チェック項目

### 1. diff-check（危険ファイル検知）

以下のファイルに変更がある場合、必ず追加のチェックを実施する：

- `server/_core/oauth.ts`
- `server/_core/auth*`
- `vercel.json`
- `railway.json`
- `.env*`
- `app.config.ts`
- `health` 関連ファイル
- `build-info` 関連ファイル

### 2. 禁止パターンのチェック

以下のパターンがdiffに含まれる場合、OAuth smoke testを必須とする：

- `host.replace(`
- `redirect_uri`
- `callback`
- `oauth`

### 3. デプロイ後検証

デプロイ完了後、以下を必ず確認する：

1. `/api/health` が `ok: true` を返すこと
2. `commitSha` が期待値（`GITHUB_SHA`）と一致すること
3. ログイン開始URLが想定ドメインであること

### 4. 影響範囲の明確化

PR作成時、以下を必ず記載する：

- 影響するユーザー（未ログイン/ログイン済み）
- 影響する画面（ログイン/コールバック/マイページ）
- 影響する設定（ドメイン/プロキシ/環境変数）
- 壊れた時に戻す方法（ロールバック手順）

---

## ルール

### Gate 1 Rule 1: OAuth系の差分が出たら必ずOAuth回帰テストを回す

OAuth関連のファイル（`oauth.ts`, `auth.ts`, `callback`など）に変更がある場合、必ず以下のテストを実行する：

```bash
pnpm exec playwright test tests/e2e/auth.login.spec.ts --reporter=list
```

### Gate 1 Rule 2: デプロイ後に必ずcommitShaを照合する

デプロイ完了後、以下のコマンドで検証する：

```bash
curl https://doin-challenge.com/api/health | jq '.commitSha'
```

返ってきた`commitSha`が`GITHUB_SHA`と一致しない場合、デプロイが失敗している可能性がある。

### Gate 1 Rule 3: 危険変更はFeature Flagの背後へ

可能な限り、危険な変更はFeature Flagで制御し、即座にOFFできるようにする。

---

## Definition of Done（DoD）

### DoD 1: diff-checkがCIで動き、危険変更は落ちる

- `scripts/diff-check.sh`が実装されている
- GitHub Actionsで自動実行される
- 危険な変更が検知された場合、PRチェックリストが必須になる

### DoD 2: deploy後 healthがcommitSha一致

- デプロイ後に`/api/health`を叩く
- `commitSha`が`GITHUB_SHA`と一致することを確認
- 一致しない場合、CIが失敗する

### DoD 3: 失敗時の復旧手順がdocsに追記

- ロールバック手順が明確に記載されている
- 問題が発生した場合、誰でも復旧できる

---

## 監視ツール

### UptimeRobot

- 監視URL: `/api/health`
- 監視間隔: 5分
- 200以外のレスポンスで通知

### Sentry

以下の3つだけ通知対象にする（ノイズ抑制）：

1. ログイン失敗の急増（OAuth callback error）
2. 5xxの急増
3. "unknown version"検知（healthがunknownを返したら例外を投げる）

---

## 次にやるべき具体アクション

1. ✅ diff-checkをGitHub Actionsに組み込み（危険ファイル/禁止ワード）
2. ✅ deploy後に `/api/health` を叩いて `commitSha === GITHUB_SHA` を検証
3. ⬜ UptimeRobotで `/api/health` を監視
4. ⬜ Sentry導入（通知は最小3種類だけ）

---

## Manusへの依頼テンプレ

```
目的（Why）: Gate 1を満たすため

DoD（合格条件）:
1. diff-checkがCIに入り、危険変更で落ちる
2. deploy後 `/api/health` の `commitSha` が `GITHUB_SHA` と一致
3. 失敗時の復旧手順がdocsに追記

禁止:
- OAuthのリダイレクト生成ロジックを"推測で"変えない
- 本番でのURL組み立てを置換で逃げない

変更範囲（Allowed files）:
- `scripts/diff-check.sh`
- `.github/workflows/*`
- `docs/gate1.md`
```
