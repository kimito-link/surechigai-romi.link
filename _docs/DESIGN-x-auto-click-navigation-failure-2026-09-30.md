# Xワンタップログイン: 自動click後にX認可画面へ遷移しない問題（調査中・未解決）

> 状態: **原因の手前まで特定・未解決**。実装未着手。次に読む人はここから再開できる。

## 症状

`surechigai.kimito.link/sign-in?...&auto=x`（新規タブ・sessionStorageクリア済みのクリーンな
状態）にアクセスすると:

1. `AutoAdvanceToX`（`components/auth/auto-advance-to-x.tsx`）の自動click検出ロジックは
   正常に動作し、Xボタンを発見して`button.click()`を実行する
   （`sessionStorage['surechigai:auto-x-last-fired-at']`に新しいタイムスタンプが打刻される
   ことで確認済み）
2. **しかし実際にはX OAuth認可画面（`x.com/i/oauth2/authorize`）へ遷移しない**
3. 同じXボタンを、後から手動で`.click()`すると正常にX認可画面へ遷移する
   （＝Xボタン自体・Clerk自体は正常）

この症状は`AutoXReturnNotice`（`components/auth/auto-x-return-notice.tsx`）の
「ログインはキャンセルされました」通知を誤って誘発する（実際にはX画面へ行っていないのに、
「戻ってきた」ように見える）。

## 前提として解消済みの別問題（混同しないこと）

調査の過程で、**この症状とは別の、独立した2つの重大バグ**を発見し既に修正・デプロイ済み:

1. **CI Gate 1誤検知**（`check-native-unsafe-dom.mjs`のLOOKBACK=60行超過）
   → コミット`dedadbd9c`で修正済み
2. **`surechigai-romi.link`（カスタムドメイン）経由アクセス時のCSPバグ**
   （vercel.jsonの`/:path*`がルートパス`/`にマッチせず、トップページだけ
   `surechigai.kimito.link`へリダイレクトされず200 OKで直接HTMLを返していた。
   結果、`expo-router`の`origin`設定に基づく絶対URLアセットがCSPでブロックされ、
   アプリ全体が動作不能になっていた）
   → コミット`7fa21f6c1`で修正済み・本番確認済み

★**重要**: 2のCSPバグを修正した後も、**`surechigai.kimito.link`への直接アクセスで
本項の症状（自動click後に遷移しない）は再現し続けている**。つまり2つは独立した問題。

## 本項の調査で新たに確定した事実（2026-09-30）

1. **サイト全体でReact hydrationエラー（Minified React error #418）が発生している。**
   `AutoAdvanceToX`が乗っている`/sign-in`ページだけでなく、トップページ`/`でも同様に
   発生する（サイト全体の既存の問題、CSPバグとは無関係）。
   - error #418の意味: 「サーバーがレンダリングしたHTMLとクライアントの初回レンダリングが
     一致しない」hydration failed。Reactは自動的にクライアント側でツリーを再生成する。
   - `AutoAdvanceToX`・`AutoXReturnNotice`自身は`useState(false)`で初期化し
     `useEffect`内でのみ状態を変えるため、この2コンポーネント自体がhydrationミスマッチの
     直接の原因ではなさそう（要再検証）。

2. **`tryClick()`内で`removeAutoXParam()`を呼んでいるのに、URLの`?auto=x`パラメータが
   除去されない。** これが本症状の核心に最も近い手がかり。
   - `removeAutoXParam()`のコード自体（`window.history.replaceState`でクエリパラメータを
     削除する処理）は一見正しい。
   - にもかかわらず、`tryClick()`実行後（`firedAt`打刻確認済み）もURLに`auto=x`が
     残り続けている。
   - **仮説（未検証）**: Expo Routerのクライアントサイドルーターが、`window.history`への
     直接操作（`replaceState`）を、自身の内部ルーティング状態と非同期に上書き・復元して
     いる可能性が高い。Expo Routerは`window.history`をラップして独自に管理するため、
     生の`history.replaceState`呼び出しと競合することが知られている。

## 次に調べること（未着手）

1. **`removeAutoXParam()`が本当に呼ばれているか、呼ばれた直後のURLがどうなっているかを
   1行ずつ計測する。** `console.log`を`removeAutoXParam()`の前後に仕込み、
   実際に`history.replaceState`呼び出し直後の`location.href`を確認する
   （このDESIGN作成時点では、外部からのJS注入によるinstrumentationでは
   ページロード直後のタイミングを捉えられなかった——`location.reload()`で
   注入したコードも消えるため。ソースコード自体に一時的なdebugログを仕込んで
   デプロイし直すのが確実）。
2. **Expo Routerが`window.history.replaceState`をラップしているか確認する。**
   `node_modules/expo-router/`のソースで`history.replaceState`や`pushState`への
   参照を検索し、独自の状態管理と競合する構造になっていないか調べる。
3. **hydrationエラー（#418）が本当に無害か再検証する。** Reactが
   「クライアント側で再生成する」際に、`AutoAdvanceToX`の`useEffect`が
   一瞬余分に実行される（マウント→アンマウント→再マウント）ことで、
   `MutationObserver`や`setInterval`が二重に走り、`cleanupTimers()`の
   タイミングがずれて`button.click()`実行直後に何かがクリーンアップされて
   しまっている可能性がある。React DevToolsやdevビルドでの再現を試す。
4. **`AutoXReturnNotice`と`AutoAdvanceToX`の間のsessionStorageキー
   （`surechigai:auto-x-last-fired-at`）を介した暗黙の結合が、意図しない
   タイミングで発火記録を作っていないか再確認する。**

## 関連ファイル

- `components/auth/auto-advance-to-x.tsx`（本体、2026-09-30に2回修正済み。
  タイムアウト可視化・Gate1修正。ロジック自体は未変更）
- `components/auth/auto-x-return-notice.tsx`（「キャンセルされました」通知）
- `lib/clerk-route.ts`（`SIGN_IN_AUTO_X_HREF`定義）
- 正本KB: `ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md`
  （DOM click送信方式の設計思想。本症状はこの方式自体の限界を示す可能性がある）
- 関連コミット:
  - `dedadbd9c`（Gate1修正）
  - `7fa21f6c1`（CSPバグ修正）
  - `801b82cf7`（タイムアウト検知の初期実装、その後cc44f3cd7と同内容）

## 参考: kimitolink-linktree本体・kimito-Link-Voiceでは症状が出ない理由（未確認・仮説）

kimitolink-linktree（Next.js）・kimito-Link-Voice（静的HTML/Vanilla JS）は、どちらも
Expo Routerを使っていない。もしExpo Routerのhistory競合が真因なら、この2つで症状が
出ないことと整合する。surechigai-romi.linkだけがExpo/React Native Web構成であり、
これが「同じDOM click送信方式なのに、この1プロジェクトだけ失敗する」ことの説明になりうる。
