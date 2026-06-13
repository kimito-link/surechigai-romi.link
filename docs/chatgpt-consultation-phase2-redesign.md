# ChatGPT相談: Phase 2実装ガイドの再構成

## 現在の状況

### 本番環境の復旧完了

- Vercelで安定版を手動Promote

- PC/スマホでログイン機能が正常動作

- GitHub mainは`7cf0a0c`（Phase 2実装前の安定版）

### Phase 2実装の失敗から学んだこと

Phase 2実装では「ログインUX改善」として以下を実装しようとしました：

- ログイン確認モーダル

- ローディング画面

- エラー画面

- キャンセル処理

しかし、実装中にOAuthコールバックを壊してしまい、本番障害が発生しました。

---

## 前回の回答で明確になったこと

### 思想（Why）

- **目的**: ログインが必要な場面で、ユーザーが迷わず・怖がらず・戻ってこれる体験を作る

- **増やしたい幸せ**:
  - "押していいボタン"が一目で分かる
  - 外部（X公式）に飛ぶ前後で不安にならない
  - キャンセル/失敗しても「次に何をすればいいか」が明確

- **捨てるもの**:
  - 技術的に正しいけどユーザーに伝わらない文言（例：「認証」）
  - "賢そうに見せるための複雑さ"（エラー詳細の出し過ぎ等）
  - 1回の実装で全部完成させようとする完璧主義

### 前提（Assumptions）

- **ログインは外部遷移が必須**（X公式画面に移動する）

- **login()は黒箱**:
  - `login(returnUrl?, forceSwitch?) => Promise<void>`
  - 成功/失敗は戻り値で判定できない
  - 成否は「アプリ側のセッション状態（Auth Context）変化」で検知する

- **OAuthコールバックは壊すと即死**:
  - 触らない／触るなら別フェーズ・別PR・別テスト体制

- **二重導線が混乱を生む**:
  - トップとメニューに「Xでログイン」が2つあるのは、UX的負債になりやすい

### ポリシー（Rules）

- **P0: OAuthコールバック・サーバ認証経路に触れない**（Phase 2ではUIラップのみ）

- **P0: ログイン開始は"必ずユーザーの明示タップ"でのみ**（自動login禁止）

- **P0: 画面状態は有限状態機械（FSM）で管理**
  - idle → confirm → redirecting → waitingReturn → success/cancel/error

- **P1: キャンセル/失敗は必ず「次の一手」を出す**
  - 「もう一度ログイン」「ログインせず戻る」

- **P1: 文言はログイン基調、絵文字禁止、りんくの吹き出しで統一**

- **P2: 危険変更をCIで検知**
  - `app/oauth/**`, `server/twitter*`, `hooks/use-auth.ts` などに触れたら fail/要承認

---

## 相談内容

### 1. 状態遷移（FSM）の具体化

前回の回答で以下の状態遷移が提示されました：

```
idle → confirm → redirecting → waitingReturn → success/cancel/error
```

この状態遷移を具体化したいです：

**質問**:

- 各状態で表示する画面は何か？

- 各状態の遷移条件は何か？

- キャンセル判定のタイミングは？（15〜30秒？AppState復帰？）

### 2. UIコンポーネントの設計

前回の回答で以下のコンポーネントが提示されました：

- LinkSpeech（りんくの吹き出し）

- LinkAuthResult（キャンセル/エラー/成功画面）

- LinkAuthLoading（ローディング画面）

**質問**:

- 各コンポーネントのpropsは何か？

- どの状態でどのコンポーネントを表示するか？

- 既存のコンポーネント（LogoutConfirmModal等）との関係は？

### 3. 実装手順（1PR=1状態）

前回の回答で「1PR=1状態で実装」が推奨されました。

**質問**:

- 実装順序は？（キャンセル→エラー→ローディング→ログアウト？）

- 各PRで何をテストするか？

- 各PRのコミットメッセージは？

### 4. テスト戦略

前回の回答で「unit最小 + 手動1分儀式 + diff-check」が提示されました。

**質問**:

- 「手動1分儀式」の具体的な手順は？

- diff-checkで監視すべきファイルは？

- E2Eテストは必要か？

### 5. NG集（触ってはいけないファイル）

前回の回答で以下が提示されました：

- `app/oauth/**`

- `server/twitter*`

- `hooks/use-auth.ts`

**質問**:

- 他に触ってはいけないファイルは？

- これらのファイルを触らずにログインUXを改善する方法は？

---

## 期待する回答

- 状態遷移図（Mermaid形式）

- 各コンポーネントのprops定義（TypeScript型定義）

- 実装手順（1PR=1状態、具体的なタスクリスト）

- テスト戦略（手動1分儀式の手順、diff-checkの設定）

- NG集（触ってはいけないファイルリスト、禁止ワードリスト）

---

## 補足情報

### 現在のlogin()関数の実装

```typescript
// hooks/use-auth.ts
export function useAuth() {
  // ...
  const login = async (returnUrl?: string, forceSwitch?: boolean) => {
    // OAuthフローを開始（外部遷移）
    // 成功/失敗は戻り値で判定できない
  };
  // ...
}
```

### 現在のAuth Context

```typescript
// lib/auth-provider.tsx
export const AuthContext = createContext<{
  user: User | null;
  isLoggedIn: boolean;
  error: string | null;
  // ...
}>({
  user: null,
  isLoggedIn: false,
  error: null,
  // ...
});
```

### 現在のログインボタン

```typescript
// トップページ
<Button onPress={() => login()}>Xでログイン</Button>

// メニュー
<Button onPress={() => login()}>Xでログイン</Button>
```

---

## 次のステップ

ChatGPTからの回答を基に、以下を作成します：

1. **Phase 2実装ガイド**（思想・前提・ポリシーベース）

1. **状態遷移図**（Mermaid形式）

1. **実装タスクリスト**（1PR=1状態）

1. **テスト手順書**（手動1分儀式）

1. **NG集**（触ってはいけないファイル、禁止ワード）

