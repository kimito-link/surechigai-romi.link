# Git プッシュ・デプロイ時の必須ルール

このドキュメントは、AIアシスタントが「コミットしてプッシュして」「デプロイして」と依頼されたときに **忘れずに守る** 手順を記載します。  
**CLAUDE.md の「Git コミット・プッシュ・デプロイ」セクションと内容を一致させてください。**

---

## ルール: push は必ず `all` 権限で実行する

| 作業 | 権限 | 備考 |
|------|------|------|
| `git add` / `git commit` | `git_write` で可 | 通常どおり |
| **`git push origin main`** | **必ず `required_permissions: ['all']`** | これがないと認証で失敗する |

---

## 理由

- Cursor のツールで `git push` を実行するとき、**サンドボックスあり**（`network` + `git_write` のみ）だと、Windows の認証情報（Credential Manager / GitHub ログイン）にアクセスできない。
- その結果、`Authentication failed` / `No anonymous write access` となり push が失敗する。
- **`all`（サンドボックス無効）** で実行すると、保存済みの認証が使われ、push が成功する。
- push が成功すると、Vercel が main への push を検知して **自動でデプロイ** する。

---

## 手順（依頼されたら実行する流れ）

1. 変更をステージ: `git add`（対象パスを指定）
2. コミット: `git commit -m "..."`（`git_write` で可）
3. **プッシュ: `git push origin main` を `required_permissions: ['all']` で実行**
4. ユーザーに「push 完了。Vercel が自動でデプロイします」と伝える

---

## 更新履歴

- 初回: push を `all` 権限で実行するルールを CLAUDE.md とこの md に明記（忘れないため）。
