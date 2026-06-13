# デプロイワークフロー

> **対象**: 人間（開発者）& AI（Manus/Claude Code）
> **最終更新**: 2026-01-22

---

## 概要

このプロジェクトは以下の構成でデプロイされています：

| コンポーネント | サービス | URL |
|---------------|---------|-----|
| フロントエンド | Vercel | doin-challenge.com |
| バックエンド | Railway | doin-challengecom-production.up.railway.app |
| DNS | Cloudflare | - |
| リポジトリ | GitHub | kimito-link/doin-challenge.com |

---

## デプロイの流れ

```
┌─────────────────────────────────────────────────────────────┐
│  1. Manusで開発・修正                                        │
│     - コードを書く、バグを修正する                            │
│     - Manusがローカルリポジトリにコミット                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GitHubにpush                                            │
│     - Manusに「GitHubにpushして」と依頼                      │
│     - または、スマホ/PCからGitHubにpush                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. GitHub Actionsが自動実行                                 │
│     CI → Backend → Migrate → Health Check → Frontend → E2E │
│     安全なパイプラインが保証される                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 本番環境に反映                                           │
│     doin-challenge.com で動作確認                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 作業別の方法

| 作業 | 方法 | 備考 |
|------|------|------|
| コード修正 | Manusで作業 → Manusがpush | 通常の開発作業 |
| デプロイ確認 | GitHub Actionsが自動実行 | Actionsタブで確認 |
| ワークフロー修正 | ローカルPCから | `.github/workflows/`の変更 |

---

## pushコマンド

### Manusからpushする場合

```bash
# 1. 変更をコミット（Manusが自動で行う）
git add -A
git commit -m "修正内容の説明"

# 2. origin/mainにpush
git push origin main

# 3. production/mainにpush（デプロイトリガー）
git push production main:main
```

### コンフリクトが発生した場合

```bash
# リモートの変更をマージしてからpush
git fetch production
git pull production main --no-rebase --no-edit
git push production main:main
```

---

## 重要な注意事項

### Vercelの自動デプロイはオフ

- Vercelの自動デプロイは**無効化**されています
- GitHub Actionsのパイプラインがデプロイを制御します
- 手動でVercelからデプロイしないでください

### ブランチ構成

| ブランチ | 用途 |
|---------|------|
| `main` | 開発ブランチ |
| `production/main` | 本番デプロイトリガー |

### GitHub Actions パイプライン

`.github/workflows/deploy.yml` が以下を実行：

1. **CI**: テスト・ビルド確認
2. **Backend**: Railwayにデプロイ
3. **Migrate**: データベースマイグレーション
4. **Health Check**: バックエンドの動作確認
5. **Frontend**: Vercelにデプロイ
6. **E2E**: エンドツーエンドテスト

---

## トラブルシューティング

### デプロイが始まらない

1. GitHubのActionsタブを確認
2. ワークフローがトリガーされているか確認
3. エラーがあればログを確認

### pushが拒否される

```bash
# リモートの変更を取り込む
git fetch production
git pull production main --no-rebase --no-edit
git push production main:main
```

### Vercel/Railwayに反映されない

1. GitHub Actionsの実行状況を確認
2. 各ステップのログを確認
3. 失敗している場合は原因を特定して修正

---

## 確認用リンク

- **本番サイト**: https://doin-challenge.com
- **GitHub Actions**: https://github.com/kimito-link/doin-challenge.com/actions
- **Vercel Dashboard**: https://vercel.com/kimito-link/doin-challenge-com
- **Railway Dashboard**: https://railway.app/project/e5895389-8823-49f2-9b30-ad5b816cbf6e
