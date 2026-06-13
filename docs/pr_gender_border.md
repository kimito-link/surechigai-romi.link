# PR: 性別ボーダー on コメントカード（UIのみ）

## 概要

応援メッセージカードに性別を表す左ボーダー（2px）を追加し、視認性を向上させます。

## 変更内容

### 1. MessageCardコンポーネント（`features/events/components/MessageCard.tsx`）

**変更前:**
- 性別ごとに異なる背景色（青/ピンクの半透明）
- 左ボーダー3px
- 性別アイコン: 絵文字（👨/👩）

**変更後:**
- 背景色を黒ベース（`palette.gray800`）で統一
- 左ボーダー2pxで性別を表現
  - 男性: 青 (`palette.genderMale` = #3B82F6)
  - 女性: ピンク (`palette.genderFemale` = #F472B6)
  - 未設定: ニュートラル (`palette.genderNeutral` = rgba(255,255,255,0.12))
- 性別アイコン: 記号（♂/♀）に変更、ボーダー色と同じ色で表示

### 2. カラーパレット（`theme/tokens/palette.ts`）

**追加:**
- `genderNeutral`: 未設定時の左ボーダー色

**変更:**
- `genderFemale`: #EC4899 → #F472B6（v6.63仕様に合わせて変更）

## 影響範囲

### 変更されるファイル
- `features/events/components/MessageCard.tsx`（応援メッセージカード）
- `theme/tokens/palette.ts`（カラーパレット定義）

### 影響を受ける画面
- **チャレンジ詳細画面**（`app/event/[id].tsx`）
  - 応援メッセージセクションのカード表示

### 影響を受けない機能
- データベース: 変更なし
- API: 変更なし
- ルーティング: 変更なし
- 他のコンポーネント: 変更なし

## 確認手順

### 1. ローカル環境での確認

```bash
# 依存関係のインストール
pnpm install

# 型チェック
pnpm run check

# Lint
pnpm run lint

# テスト実行
pnpm run test
```

### 2. 視覚的確認

1. チャレンジ詳細画面を開く
2. 応援メッセージセクションを確認
3. 以下の点をチェック:
   - [ ] 男性参加者のカードに青い左ボーダー（2px）が表示される
   - [ ] 女性参加者のカードにピンクの左ボーダー（2px）が表示される
   - [ ] 性別未設定の参加者のカードに薄いニュートラルな左ボーダーが表示される
   - [ ] すべてのカードの背景色が黒ベース（#171717）で統一されている
   - [ ] 名前の横に性別アイコン（♂/♀）が表示される
   - [ ] 性別アイコンの色がボーダー色と一致している

### 3. CI/CDパイプラインの確認

GitHub Actionsで以下のジョブが通過することを確認:
- [ ] Preflight (TypeScript, ESLint, Vitest)
- [ ] Backend Deploy (Railway)
- [ ] Frontend Deploy (Vercel)
- [ ] E2E Smoke Test (Playwright)

## 復帰方法

### 方法1: Gitリバート

```bash
git revert <this_commit_hash>
git push origin main
```

### 方法2: 前のコミットにリセット

```bash
git reset --hard <復帰したいコミットSHA>
git push origin main --force
```

### 方法3: バックアップディレクトリから復元

```bash
cd /tmp/doin-challenge-backup-20260123
# 必要なファイルをコピー
cp features/events/components/MessageCard.tsx /path/to/project/
cp theme/tokens/palette.ts /path/to/project/theme/tokens/
```

## テスト結果

### ESLint
- **修正前**: 16個の警告
- **修正後**: 11個の警告
- **改善**: 5個の警告を解消（今回の変更分）

### TypeScript
- エラー: 0個

### Vitest
- （実行待ち）

## スクリーンショット

### Before（修正前）
- 性別ごとに異なる背景色
- 左ボーダー3px
- 絵文字アイコン（👨/👩）

### After（修正後）
- 黒ベース背景で統一
- 左ボーダー2pxで性別を表現
- 記号アイコン（♂/♀）

（注: スクリーンショットは実機/ブラウザでの確認後に追加）

## 関連ドキュメント

- `docs/gpt-consultation-workflow-recovery.md`: ワークフロー復旧戦略

## チェックリスト

- [x] コードの変更完了
- [x] ESLint警告の解消（今回の変更分）
- [ ] TypeScript型チェック通過
- [ ] Vitest通過
- [ ] ローカルでの視覚的確認
- [ ] GitHub Actions通過
- [ ] PRドキュメント作成

---

**作成日**: 2026年1月23日  
**作成者**: Manus AI  
**目的**: Phase 1-1の変更内容を記録し、レビューと復帰を容易にする
