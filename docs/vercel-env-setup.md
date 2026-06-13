# Vercel環境変数設定ガイド

## 目的

`/api/health`エンドポイントで正しいcommitShaを返すため、Vercelのプロジェクト設定で環境変数を追加します。

## 問題の背景

Railway × esbuild × build-info.jsonの組み合わせでは、`prebuild`スクリプトが実行されず、`build-info.json`ファイルが正しく生成されない問題がありました。GPTの推奨に従い、**ENV変数一択**で解決します。

## 設定手順

### 1. Vercelダッシュボードにアクセス

https://vercel.com/kimito-link/doin-challengecom/settings/environment-variables

### 2. 環境変数を追加

以下の環境変数を**Production、Preview、Development**すべての環境に追加してください：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `RAILWAY_GIT_COMMIT_SHA` | `$VERCEL_GIT_COMMIT_SHA` | デプロイされたcommitのSHA（Vercelの自動変数） |
| `APP_VERSION` | `$VERCEL_GIT_COMMIT_SHA` | アプリのバージョン（commitSHAと同じ） |
| `GIT_SHA` | `$VERCEL_GIT_COMMIT_SHA` | Git commit SHA |
| `BUILT_AT` | `$(date -u +%Y-%m-%dT%H:%M:%SZ)` | ビルド時刻（手動で設定する場合） |

### 3. Vercelの自動変数について

Vercelは以下の自動変数を提供しています：

- `VERCEL_GIT_COMMIT_SHA`: デプロイされたcommitのSHA
- `VERCEL_GIT_COMMIT_REF`: ブランチ名
- `VERCEL_URL`: デプロイされたURL

これらの変数は、Vercelのビルド時に自動的に設定されます。

### 4. 設定後の確認

環境変数を設定したら、再デプロイして`/api/health`を確認してください：

```bash
curl https://doin-challenge.com/api/health | jq
```

`commitSha`フィールドが`unknown`ではなく、実際のcommit SHAを返すことを確認してください。

## トラブルシューティング

### `commitSha`が`unknown`のまま

- Vercelの環境変数設定を確認
- 再デプロイを実行
- `/api/health`のコードを確認（ENV優先になっているか）

### `VERCEL_GIT_COMMIT_SHA`が空

- Vercelのプロジェクト設定でGit連携が正しく設定されているか確認
- GitHub連携を再接続

## 参考

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel System Environment Variables](https://vercel.com/docs/projects/environment-variables/system-environment-variables)
