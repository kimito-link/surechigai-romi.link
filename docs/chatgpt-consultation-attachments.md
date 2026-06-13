# ChatGPT相談用 添付ファイルリスト

## 相談内容本体

- `docs/chatgpt-consultation-phase2-next-steps.md` - 相談内容（このファイルをメインで送る）

## 必須添付ファイル

### 1. Phase 2実装ガイド
- **ファイル**: `docs/phase2-implementation-guide.md`
- **内容**: FSM設計、状態遷移図、実装方針、NG集

### 2. 現在のFSM実装
- **ファイル**: `hooks/use-auth-ux-machine.ts`
- **内容**: PR-3まで完了したFSM実装（idle → confirm → redirecting → waitingReturn）

### 3. ユニットテスト
- **ファイル**: `hooks/__tests__/use-auth-ux-machine.test.ts`
- **内容**: FSM状態遷移のテスト（9テスト全パス）

### 4. PR-3レビューチェックリスト
- **ファイル**: `docs/pr3-review-checklist.md`
- **内容**: 手動レビューの基準（ChatGPTレビューでも使える）

## 参考ファイル（必要に応じて）

### 5. コンポーネント実装例
- `components/auth-ux/waiting-return-screen.tsx` - WaitingReturnScreenの実装
- `components/auth-ux/redirecting-screen.tsx` - RedirectingScreenの実装
- `components/auth-ux/login-confirm-modal.tsx` - LoginConfirmModalの実装

### 6. todo.md（タスク全体）
- **ファイル**: `todo.md`
- **内容**: Phase 2を含む全タスクリスト（4300行以上）
- **注意**: 長いので、Phase 2部分だけ抜粋して送る

## ChatGPTへの送り方

### ステップ1: 相談内容を送る
```
添付: docs/chatgpt-consultation-phase2-next-steps.md

「Phase 2の次のステップについて相談させてください。
添付のドキュメントを読んで、5つの質問に答えてください。」
```

### ステップ2: 実装ガイドを送る
```
添付: docs/phase2-implementation-guide.md

「こちらがPhase 2の実装ガイドです。
FSM設計と状態遷移図が含まれています。」
```

### ステップ3: 現在の実装を送る
```
添付: hooks/use-auth-ux-machine.ts
添付: hooks/__tests__/use-auth-ux-machine.test.ts

「こちらが現在のFSM実装とテストです。
PR-3まで完了しています。」
```

### ステップ4: レビュー基準を送る
```
添付: docs/pr3-review-checklist.md

「こちらが手動レビューの基準です。
ChatGPTレビューでも同じ基準を使いたいです。」
```

## 期待する回答の形式

ChatGPTに以下の形式で回答してもらうよう依頼：

```markdown
# Phase 2次のステップ 回答

## 1. 実装順序の推奨
【A案/B案/C案のどれか、または別案】
理由: ...

## 2. 実装戦略の推奨
【個別/まとめて、どちらか】
理由: ...

## 3. テスト戦略の推奨
【ユニットテストのみ/E2Eテストも必要】
理由: ...

## 4. waitingReturn状態からの遷移ロジック
- タイムアウト後: ...
- ブラウザを閉じた場合: ...
- ネットワークエラー: ...

## 5. ChatGPTレビューの活用法
【具体的な手順】
```

## ファイルの場所

全てのファイルは `/home/ubuntu/birthday-celebration/` 以下にあります。
