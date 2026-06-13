# ローカル開発ワークフロー

**最終更新**: 2026-02-02  
**対象者**: 開発者（ローカル環境で開発し、iOS/Androidビルド時のみManusを使用）

このドキュメントは、**日常的な開発をローカル環境で行い、iOS/Androidビルドが必要なときだけManusを使用する**ワークフローを説明します。

---

## 🎯 ワークフローの概要

| 作業 | 環境 | Manusコスト |
|------|------|-------------|
| コード編集 | **ローカル（VS Code等）** | **0円** |
| Web動作確認 | **ローカル** | **0円** |
| Git commit/push | **ローカル** | **0円** |
| Webデプロイ | **GitHub Actions（自動）** | **0円** |
| **iOS/Androidビルド** | **Manus（必要時のみ）** | 使用時のみ |

**メリット**:
- 開発中はManusを一切使わないため、コストを最小化
- ローカル環境で自由に開発・テスト可能
- Manusの強み（iOS/Androidビルド）だけを活用

---

## 📋 初回セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/kimito-link/doin-challenge.com
cd doin-challenge.com
```

### 2. 依存関係をインストール

```bash
# pnpmをインストール（未インストールの場合）
npm install -g pnpm

# 依存関係をインストール
pnpm install
```

### 3. 環境変数を設定

`.env.local`ファイルを作成し、以下を追加：

```bash
# データベース接続情報（Management UI → Database → Connection Infoから取得）
DATABASE_URL="postgresql://..."

# その他の環境変数（必要に応じて）
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

**データベース接続情報の取得方法**:
1. Manusで`birthday-celebration`プロジェクトを開く
2. Management UI → Database → Connection Info（左下の設定アイコン）
3. `DATABASE_URL`をコピーして`.env.local`に貼り付け

---

## 🚀 日常的な開発フロー

### Step 1: ローカル開発サーバーを起動

```bash
pnpm dev
```

**アクセス先**:
- Web版: http://localhost:8081
- iOS/Android: Expo Goアプリで開発サーバーに接続

### Step 2: コードを編集

VS Code等のエディタで自由に編集：

```bash
# 例: ホーム画面を編集
code app/(tabs)/index.tsx
```

### Step 3: 動作確認

- **Web版**: ブラウザでhttp://localhost:8081にアクセス
- **iOS/Android**: Expo Goアプリで開発サーバーに接続

### Step 4: Git管理

```bash
# 変更をステージング
git add .

# コミット
git commit -m "機能A実装"

# GitHubにプッシュ
git push origin main
```

**結果**: GitHub Actionsが自動的にVercel/Railwayにデプロイ（5-10分）

---

## 📱 iOS/Androidビルド（Manusを使用）

### いつManusを使うか？

- **テスト用にIPA/APKファイルが必要なとき**
- **App Store/Google Playにリリースするとき**

### ビルド手順

1. **Manusを開く**: https://manus.im
2. **プロジェクトを開く**: `birthday-celebration`
3. **最新コードを同期**:
   - Management UI → Code → 「Sync from GitHub」（存在する場合）
   - または、ローカルの変更をManusにコピー
4. **Publishボタンをクリック**: Management UI右上
5. **ビルド完了を待つ**: 10-15分
6. **IPA/APKをダウンロード**: Management UIからダウンロード

**注意**: ビルド後はManusを閉じてOK（コストを節約）

---

## 🔄 GitHubとの同期

### ローカル → GitHub

```bash
git push origin main
```

### GitHub → Manus

**方法1**: Management UI → Code → 「Sync from GitHub」（推奨）

**方法2**: 手動コピー
```bash
# Manusのターミナルで実行
cd /tmp
git clone https://<GITHUB_TOKEN>@github.com/kimito-link/doin-challenge.com.git sync
cp -r sync/* /home/ubuntu/birthday-celebration/
```

**注意**: `<GITHUB_TOKEN>`はREADME.mdに記載されているGitHub Personal Access Tokenに置き換えてください。

---

## 🛠️ よく使うコマンド

### 開発

```bash
# 開発サーバー起動
pnpm dev

# TypeScriptエラーチェック
pnpm check

# ビルド（本番環境と同じ）
pnpm build

# テスト実行
pnpm test
```

### データベース

```bash
# マイグレーション実行
pnpm db:push

# データベースをリセット（開発環境のみ）
pnpm db:reset
```

### Git

```bash
# 変更を確認
git status

# 変更を破棄
git checkout .

# 最新のmainブランチを取得
git pull origin main
```

---

## 📊 デプロイフロー図

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ローカルで開発                                              │
│    → VS Code等で編集 + git commit                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHubにプッシュ                                            │
│    → git push origin main                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GitHub Actions自動実行                                      │
│    → Vercel/Railwayに自動デプロイ（5-10分）                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 本番環境で確認                                              │
│    → https://doin-challenge.com                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 5. iOS/Androidビルドが必要な場合のみ                            │
│    → Manusを開いて「Publish」ボタン                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 チェックリスト

### 日常的な開発

- [ ] ローカル開発サーバーが起動している（`pnpm dev`）
- [ ] Web版で動作確認している（http://localhost:8081）
- [ ] TypeScriptエラーがない（`pnpm check`）
- [ ] Git commitしている（`git commit`）
- [ ] GitHubにプッシュしている（`git push origin main`）

### iOS/Androidビルド時

- [ ] 最新コードがGitHubにプッシュされている
- [ ] Manusで最新コードを同期している
- [ ] `shared/version.ts`のバージョンが更新されている
- [ ] Publishボタンをクリックしている
- [ ] ビルド完了を確認している

---

## 🔧 トラブルシューティング

### 問題1: ローカル開発サーバーが起動しない

**症状**: `pnpm dev`が失敗する

**解決策**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules
pnpm install
```

---

### 問題2: データベース接続エラー

**症状**: `DATABASE_URL`が見つからない

**解決策**:
1. `.env.local`ファイルが存在するか確認
2. Management UI → Database → Connection Infoから`DATABASE_URL`をコピー
3. `.env.local`に貼り付け

---

### 問題3: GitHubにプッシュできない

**症状**: `git push`が失敗する

**解決策**:
```bash
# GitHub認証を確認
git remote -v

# SSH鍵が設定されているか確認
ssh -T git@github.com
```

---

## 📚 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要とデプロイ方法
- [docs/DEPLOY.md](./DEPLOY.md) - デプロイ手順の詳細
- [docs/deployment-guide.md](./deployment-guide.md) - デプロイガイド
- [GitHub Actions](https://github.com/kimito-link/doin-challenge.com/actions) - ワークフロー実行履歴
- [Vercel Dashboard](https://vercel.com/kimito-link/doin-challenge-com) - デプロイ状況

---

## 💡 ベストプラクティス

### 1. 小さなコミットを頻繁に

```bash
# ❌ 悪い例: 1日の作業を1コミットにまとめる
git commit -m "色々修正"

# ✅ 良い例: 機能ごとにコミット
git commit -m "ホーム画面のレイアウトを修正"
git commit -m "ログイン機能を実装"
```

### 2. ブランチを活用

```bash
# 新機能開発用のブランチを作成
git checkout -b feature/new-feature

# 開発完了後、mainにマージ
git checkout main
git merge feature/new-feature
git push origin main
```

### 3. 定期的にGitHubから最新を取得

```bash
# 1日の開始時に実行
git pull origin main
```

---

## 🔐 セキュリティ注意事項

1. **`.env.local`は絶対にGitにコミットしない** - `.gitignore`に含まれていることを確認
2. **GitHub PATは機密情報** - 絶対に公開しない
3. **データベース接続情報は機密情報** - ログに出力しない

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-02-02 | v1.0 | 初版作成 - ローカル開発ワークフローの確立 |
