# PR-1実装ガイド: FSMの器だけ（idle/confirmだけ、login呼ばない）

## 目的

Phase 2の最初のPRとして、**FSMの器だけ**を実装します。

- idle ↔ confirm の状態遷移のみ
- **login()は絶対に呼ばない**（安全のため）
- 状態遷移のロジックとUIの基礎を確立

---

## 実装済みファイル

以下のファイルは既に作成済みです：

### 1. FSM状態管理

- **`hooks/use-auth-ux-machine.ts`**
  - `useAuthUxMachine()` フック
  - `AuthUxState` 型定義
  - `AuthUxAction` 型定義
  - FSM reducer（idle ↔ confirm のみ実装）

### 2. UIコンポーネント

- **`components/auth-ux/link-speech.tsx`**
  - `LinkSpeech` コンポーネント（りんくの吹き出し）
- **`components/auth-ux/login-confirm-modal.tsx`**
  - `LoginConfirmModal` コンポーネント（ログイン確認モーダル）
- **`components/auth-ux/index.ts`**
  - コンポーネントの統一エクスポート

### 3. テスト

- **`hooks/__tests__/use-auth-ux-machine.test.ts`**
  - FSM状態遷移のユニットテスト（8テスト）
  - ✅ 全テスト通過済み

---

## 実装が必要なファイル

### 1. りんくのアイコン画像

**ファイル**: `assets/images/link-icon.png`

- りんくのキャラクターアイコン
- サイズ: 256x256px 推奨
- 背景: 透過PNG

**TODO**: このアイコンを作成または既存アイコンを使用してください。

---

### 2. 実際の画面に統合

PR-1では、以下のいずれかの画面に統合してください：

#### オプションA: トップ画面に統合

**ファイル**: `app/(tabs)/index.tsx`

```tsx
import { useAuthUxMachine } from "@/hooks/use-auth-ux-machine";
import { LoginConfirmModal } from "@/components/auth-ux";

export default function HomeScreen() {
  const { state, tapLogin, confirmYes, confirmNo } = useAuthUxMachine();

  return (
    <ScreenContainer className="p-6">
      {/* 既存のコンテンツ */}
      
      {/* ログインボタン */}
      <TouchableOpacity
        onPress={() => tapLogin()}
        className="bg-primary px-6 py-3 rounded-full active:opacity-80"
      >
        <Text className="text-background font-semibold">Xでログイン</Text>
      </TouchableOpacity>

      {/* ログイン確認モーダル */}
      <LoginConfirmModal
        open={state.name === "confirm"}
        speech={{
          title: "りんく",
          message: "Xの画面に移動してログインするよ。戻ってきたら自動で続きに進むよ。",
        }}
        confirmLabel="Xでログインする"
        cancelLabel="やめる"
        onConfirm={confirmYes}
        onCancel={confirmNo}
      />
    </ScreenContainer>
  );
}
```

#### オプションB: メニュー画面に統合

**ファイル**: `app/(tabs)/menu.tsx`（または該当するメニュー画面）

同様の実装を追加してください。

---

## 手動テスト手順（1分儀式）

### 1. アプリ起動

```bash
cd /home/ubuntu/birthday-celebration
pnpm dev
```

### 2. テスト手順

1. **アプリ起動**（トップ表示）
2. **「Xでログイン」ボタンをタップ**
   - ✅ ログイン確認モーダルが表示される
   - ✅ りんくのアイコンが表示される
   - ✅ 文言が正しく表示される
   - ✅ ボタンが2つ表示される（「Xでログインする」「やめる」）
3. **「やめる」をタップ**
   - ✅ モーダルが閉じる
   - ✅ 元の画面に戻る
4. **もう一度「Xでログイン」をタップ**
   - ✅ モーダルが再度表示される
5. **「Xでログインする」をタップ**
   - ✅ PR-1では何も起きない（次のPRで実装）
   - ✅ モーダルは開いたまま

### 3. レスポンシブチェック

- [ ] **モバイル（375px）**: モーダルが正しく表示される
- [ ] **タブレット（768px）**: モーダルが正しく表示される
- [ ] **デスクトップ（1024px以上）**: モーダルが正しく表示される
- [ ] **テキストの折り返し**: 長い文言が正しく折り返される
- [ ] **ボタンのタップ領域**: 最小44x44pxを確保
- [ ] **モーダルの中央配置**: 画面中央に正しく配置される

---

## ユニットテスト実行

```bash
cd /home/ubuntu/birthday-celebration
pnpm test hooks/__tests__/use-auth-ux-machine.test.ts
```

✅ 全テスト通過を確認してください。

---

## diff-checkチェック

PR作成後、GitHub Actionsで自動的にチェックされます。

### 確認項目

- [ ] `app/oauth/**` に触れていない
- [ ] `server/twitter*` に触れていない
- [ ] `hooks/use-auth.ts` に触れていない
- [ ] `lib/auth-provider.tsx` に触れていない
- [ ] 禁止ワード（`callback`, `oauth`, `pkce`, etc.）が差分に含まれていない

---

## PRマージ前の必須チェック

- [ ] **Vercel Production の Commit SHA と GitHub main の HEAD が一致している**
- [ ] **本番環境でログイン機能が正常動作している**
- [ ] **diff-check CIが通過している**
- [ ] **ユニットテストが全て通過している**
- [ ] **手動1分儀式を実行済み**
- [ ] **レスポンシブチェックを実行済み**

---

## コミットメッセージ例

```
feat(auth-ux): add confirm modal state machine (no login call)

- Add useAuthUxMachine hook (idle ↔ confirm only)
- Add LinkSpeech component (りんくの吹き出し)
- Add LoginConfirmModal component
- Add unit tests (8 tests, all passing)
- Integrate confirm modal into home screen

This is PR-1 of Phase 2 (Login UX improvement).
No login() call yet - just the FSM skeleton.
```

---

## 次のステップ（PR-2）

PR-1がマージされたら、PR-2に進みます：

- confirmYesで `redirecting` に遷移
- `redirecting` で `login()` を呼ぶ
- ローディング画面を表示

詳細は `docs/phase2-implementation-guide.md` を参照してください。
