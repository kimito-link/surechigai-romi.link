# Git プッシュ・デプロイ時の必須ルール

AIアシスタントは **コード変更を完了したら毎回**（ユーザーが明示依頼しなくても）この手順を実行する。  
**CLAUDE.md / AGENTS.md の「ディレクティブ 4」と `.cursor/rules/commit-push-deploy.mdc` と内容を一致させてください。**

---

## ルール: 変更完了 → コミット → プッシュ → デプロイ確認（必須）

| 作業 | 権限 | 備考 |
|------|------|------|
| `pnpm check` | 通常 | エラー 0 を確認してから commit |
| `git add` / `git commit` | `git_write` で可 | 関連ファイルのみ |
| **`git push origin main`** | **必ず `all` 権限** | Windows 認証のため |
| デプロイ確認 | `network` / `all` | GHA または version.json |

---

## 理由

- Cursor のツールで `git push` を実行するとき、**サンドボックスあり**（`network` + `git_write` のみ）だと、Windows の認証情報（Credential Manager / GitHub ログイン）にアクセスできない。
- その結果、`Authentication failed` / `No anonymous write access` となり push が失敗する。
- **`all`（サンドボックス無効）** で実行すると、保存済みの認証が使われ、push が成功する。
- push が成功すると、Vercel が main への push を検知して **自動でデプロイ** する。

---

## 手順（変更完了のたびに実行）

1. `pnpm check`（エラー 0）
2. 変更をステージ: `git add`（対象パスを指定。`dist/`・ログ・秘密は除外）
3. コミット: `git commit -m "..."`
4. **プッシュ: `git push origin main` を `all` 権限で実行**
5. **デプロイ確認**: `gh run list --workflow=deploy-vercel.yml --limit 1` または `version.json` の `commitSha`
6. 失敗時: `gh workflow run deploy-vercel.yml`

---

## 更新履歴

- 初回: push を `all` 権限で実行するルールを CLAUDE.md とこの md に明記。
- 2026-06: 「依頼されたら」→ **変更完了のたび必須** に昇格。`.cursor/rules/commit-push-deploy.mdc` 追加。
