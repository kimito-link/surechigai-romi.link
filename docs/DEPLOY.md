# デプロイ構成仕様書

**プロジェクト**: 君斗りんくの動員ちゃれんじ  
**ドメイン**: doin-challenge.com  
**最終更新**: 2026年1月22日  
**作成者**: Manus AI

---

## ⚠️ 重要：デプロイ方式が変わりました

| 項目 | 以前（〜v5.88） | 現在（v6.0〜） |
|------|----------------|----------------|
| フロントエンド | Vercel自動デプロイ | **GitHub Actions経由** |
| バックエンド | Manus Publish → Railway | **GitHub Actions経由** |
| トリガー | 手動コピー＆push | **`git push production main`** |

**現在の手順は [DEPLOY_WORKFLOW.md](./DEPLOY_WORKFLOW.md) を参照してください。**

---

## 概要

本プロジェクトは、フロントエンドとバックエンドを分離したアーキテクチャを採用しており、それぞれ異なるホスティングサービスにデプロイされています。

| 役割 | サービス | ドメイン | リポジトリ |
|------|----------|----------|------------|
| フロントエンド | Vercel | doin-challenge.com | kimito-link/doin-challenge.com |
| バックエンド（API） | Railway | api.doin-challenge.com | kimito-link/doin-challenge.com |

---

## フロントエンド（Vercel）

### 基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | doin-challenge-com |
| ホスティング | Vercel |
| ドメイン | doin-challenge.com |
| GitHubリポジトリ | kimito-link/doin-challenge.com |
| ブランチ | main |
| 自動デプロイ | **無効**（GitHub Actions経由でデプロイ） |

### デプロイトリガー（現在）

GitHub Actionsのパイプラインがデプロイを制御します。`production/main`ブランチへのpushでパイプラインが起動し、CIが成功した後にVercelへデプロイされます。

---

### 📜 以前の方法（参考・使用しない）

<details>
<summary>v5.88以前の手動デプロイ方法（クリックで展開）</summary>

以前はManusのPublishボタンはRailway（バックエンド）のみを更新していたため、フロントエンドを更新するには以下の手順でGitHubにプッシュする必要がありました。

```bash
# 1. GitHubリポジトリをクローン
cd /tmp
gh repo clone kimito-link/doin-challenge.com doin-challenge-deploy

# 2. Manusプロジェクトの変更をコピー
cd doin-challenge-deploy
cp -r /home/ubuntu/birthday-celebration/__tests__ .
cp -r /home/ubuntu/birthday-celebration/app .
cp -r /home/ubuntu/birthday-celebration/components .
cp -r /home/ubuntu/birthday-celebration/drizzle .
cp -r /home/ubuntu/birthday-celebration/server .
cp -r /home/ubuntu/birthday-celebration/shared .
cp /home/ubuntu/birthday-celebration/todo.md .

# 3. コミットしてプッシュ
git add -A
git commit -m "v5.xx: 変更内容の説明"
git push origin main
```

**この方法は現在使用しません。** GitHub Actionsパイプラインを使用してください。

</details>

---

## バックエンド（Railway）

### 基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | reasonable-abundance |
| ホスティング | Railway |
| ドメイン | api.doin-challenge.com |
| ソース | kimito-link/doin-challenge.com |
| 自動デプロイ | **無効**（GitHub Actions経由でデプロイ） |

### デプロイトリガー（現在）

GitHub Actionsのパイプラインがデプロイを制御します。`production/main`ブランチへのpushでパイプラインが起動し、CIが成功した後にRailwayへデプロイされます。

---

### 📜 以前の方法（参考・使用しない）

<details>
<summary>v5.88以前のデプロイ方法（クリックで展開）</summary>

以前はManusのUIで「Publish」ボタンをクリックすると、Railwayへのデプロイが自動的に実行されていました。

**この方法は現在使用しません。** GitHub Actionsパイプラインを使用してください。

</details>

### 環境変数

Railwayの環境変数は、Railway管理画面の「Variables」タブで設定します。主要な環境変数は以下の通りです。

| 変数名 | 説明 |
|--------|------|
| DATABASE_URL | PostgreSQLデータベース接続URL |
| TWITTER_CLIENT_ID | Twitter OAuth 2.0 クライアントID |
| TWITTER_CLIENT_SECRET | Twitter OAuth 2.0 クライアントシークレット |
| SESSION_SECRET | セッション暗号化キー |

---

## デプロイフロー（現在）

### 通常のデプロイ手順

1. **Manusでコード変更を完了**
2. **Manusで「チェックポイント保存」を実行**（webdev_save_checkpoint）
3. **GitHubにpush**
   ```bash
   git push origin main
   git push production main:main  # ← これがデプロイトリガー
   ```
4. **GitHub Actionsが自動実行**
   - CI → Backend(Railway) → Migrate → Health Check → Frontend(Vercel) → E2E
5. **本番サイトで動作確認**

詳細は **[DEPLOY_WORKFLOW.md](./DEPLOY_WORKFLOW.md)** を参照。

### 重要な注意事項

| 注意点 | 説明 |
|--------|------|
| Vercel自動デプロイ | **無効**。GitHub Actions経由でのみデプロイ |
| Manus Publishボタン | **使用しない**。GitHub pushを使用 |
| バージョン管理 | `shared/version.ts`でバージョンを一元管理 |
| キャッシュ | ブラウザキャッシュにより古いバージョンが表示される場合あり。Ctrl+Shift+Rで強制リロード |

---

## トラブルシューティング

### ブラウザで古いバージョンが表示される

1. **ブラウザキャッシュをクリア**: Ctrl+Shift+R（Mac: Cmd+Shift+R）
2. **シークレットウィンドウで確認**: Ctrl+Shift+N
3. **Vercelのデプロイ状況を確認**: https://vercel.com/kimito-link/doin-challenge-c/deployments

### Vercelにデプロイされない

1. **GitHubリポジトリを確認**: 最新コミットがプッシュされているか
2. **Vercelの接続を確認**: Settings → Git で正しいリポジトリが接続されているか
3. **手動でRedeploy**: Vercelダッシュボードで最新デプロイの「...」→「Redeploy」

### Railwayにデプロイされない

1. **ManusのPublishを再実行**
2. **Railwayのログを確認**: View logs ボタンでエラーを確認
3. **環境変数を確認**: Variables タブで必要な変数が設定されているか

---

## 関連ドキュメント

| ドキュメント | パス | 説明 |
|--------------|------|------|
| **デプロイ手順** | docs/DEPLOY_WORKFLOW.md | **現在のデプロイ手順** |
| **開発ガイド** | docs/DEVELOPMENT_GUIDE.md | 開発環境・フロー |
| サーバーREADME | server/README.md | バックエンドAPIの仕様 |
| Railway設定 | docs/RAILWAY_DEPLOY_SETUP.md | Railway詳細設定 |
| TODO | todo.md | 機能実装状況 |
| バージョン | shared/version.ts | アプリバージョン管理 |

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2026-01-22 | v6.53 | GitHub Actionsパイプラインに移行。以前の方法を「参考」として折りたたみ |
| 2026-01-19 | v5.88 | 初版作成。デプロイ構成を文書化 |
