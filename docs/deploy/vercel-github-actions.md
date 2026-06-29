# Vercel × GitHub Actions（surechigai）

> **最終更新**: 2026-06-29  
> **本番**: https://surechigai.kimito.link

---

## 概要

`main` への push、または手動実行で `.github/workflows/deploy-vercel.yml` が Vercel 本番へデプロイします。

フロー:

```
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
→ https://surechigai.kimito.link/version.json で commitSha を検証
```

`amondnet/vercel-action` は使いません（CLI が古く API エラーになるため）。

---

## GitHub Secrets（kimito-link/surechigai-romi.link）

| Secret | 内容 |
|--------|------|
| `VERCEL_TOKEN` | **classic** API トークン（無期限） |
| `VERCEL_ORG_ID` | `team_Swgqkt6DNalphrEGIexF7ZWf` |
| `VERCEL_PROJECT_ID` | `prj_Y5G5RpEsl1Esd7YBjjf1r9zepO9T` |

OAuth ログイン由来のトークンは数時間で失効するため、GHA では使わない。

---

## VERCEL_TOKEN の更新（推奨）

doin-challenge.com と同じ classic トークン（`revapp`）を共有しています。

**推奨**: doin-challenge 側の同期ワークフローを使う。

1. [doin-challenge Actions](https://github.com/kimito-link/doin-challenge.com/actions/workflows/sync-vercel-token-to-surechigai.yml) を開く
2. **Sync VERCEL_TOKEN to surechigai** → **Run workflow**
3. surechigai の Secret 更新日時を確認:

```bash
gh secret list -R kimito-link/surechigai-romi.link
```

4. デプロイ確認（任意）:

```bash
gh workflow run deploy-vercel.yml -R kimito-link/surechigai-romi.link
curl -s https://surechigai.kimito.link/version.json
```

### 手動で更新する場合

1. https://vercel.com/account/settings/tokens で classic トークンを作成（Team: KimitoLink、無期限）
2. 登録:

```bash
gh secret set VERCEL_TOKEN --repo kimito-link/surechigai-romi.link
```

---

## 関連リポジトリ（doin-challenge.com）

| 項目 | 説明 |
|------|------|
| `.github/workflows/sync-vercel-token-to-surechigai.yml` | classic トークンを surechigai にコピー |
| `REPO_ADMIN_PAT` | surechigai の Secrets を更新するための PAT（**意図的に保持**） |
| `VERCEL_TOKEN` | doin-challenge GHA 用 classic トークン（同期元） |

同期ワークフローは one-time 用ではなく、トークンローテーション時にも再利用する。

---

## 手動デプロイ（緊急時）

```bash
pnpm install
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

---

## 確認リンク

- **本番**: https://surechigai.kimito.link/version.json
- **Actions**: https://github.com/kimito-link/surechigai-romi.link/actions/workflows/deploy-vercel.yml
- **Vercel**: https://vercel.com/kimito-link/surechigai-romi-link
