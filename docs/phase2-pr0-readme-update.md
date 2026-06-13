# PR-0用のREADME更新

## 目的

Phase 2実装に入る前に、READMEに「Phase 2実装はこのガイド必須」と明記する。

---

## README.mdに追加する内容

以下のセクションをREADME.mdの適切な位置（例: "開発ガイド"セクション）に追加してください：

```markdown
## Phase 2: ログインUX改善

Phase 2（ログインUX改善）を実装する場合は、**必ず以下のガイドに従ってください**：

📄 **[Phase 2実装ガイド](./docs/phase2-implementation-guide.md)**

### 重要な原則

- **思想**: 迷わない／怖がらず／戻ってこれる
- **前提**: login()は黒箱、成否はAuth Context、外部遷移必須
- **ポリシー**: OAuth触らない、自動login禁止、FSM管理

### 実装順序

1. **PR-1**: FSMの器だけ（idle/confirmだけ、login呼ばない）
2. **PR-2**: redirecting（login呼ぶが、waitingReturnは"ただの画面"でOK）
3. **PR-3**: waitingReturn + 成否検知（Auth Context監視・AppState復帰・タイムアウト）
4. **PR-4**: cancel画面（retry/back導線）
5. **PR-5**: error画面（auth.error表示を「短文」に整形）
6. **PR-6**: success画面 + 自動close（短い演出）
7. **PR-7**: 二重導線整理（トップ/メニューのログイン導線を「1つの入口」に統一）

### PRマージ前の必須チェック

- ✅ Vercel Production の Commit SHA と GitHub main の HEAD が一致している
- ✅ 本番環境でログイン機能が正常動作している
- ✅ diff-check CIが通過している

### NG集（触ってはいけないファイル）

- `app/oauth/**`
- `server/twitter*`
- `hooks/use-auth.ts`
- `lib/auth-provider.tsx`
- OAuth callback画面/ルート

詳細は[Phase 2実装ガイド](./docs/phase2-implementation-guide.md)を参照してください。
```

---

## PR-0のコミットメッセージ例

```
docs(phase2): add Phase 2 implementation guide and CI protection

- Add Phase 2 implementation guide (思想・前提・ポリシーベース)
- Add diff-check CI workflow (OAuth/auth protection)
- Add PR template for Phase 2
- Update README with Phase 2 implementation rules
- Add Vercel/GitHub consistency check rule

This PR prepares the project for Phase 2 (Login UX improvement) implementation.
No code changes, only documentation and CI setup.
```

---

## PR-0のチェックリスト

- [ ] Phase 2実装ガイド作成完了
- [ ] diff-check CI作成完了
- [ ] PRテンプレート作成完了
- [ ] README更新完了
- [ ] Vercel/GitHub整合性チェックルール追加完了
- [ ] 全テスト通過（既存テストが壊れていないこと）
- [ ] TypeScriptエラー0件
