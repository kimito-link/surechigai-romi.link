# Xワンタップログイン: 自動click後にX認可画面へ遷移しない問題（調査中・未解決）

> 状態: **真因を`/sign-in`ページ自体のReact hydrationエラーに特定・
> このエラー自体の根本原因(SSG時とクライアントの状態不一致箇所)は未特定**。
> `AutoAdvanceToX`側での複数の緩和策(click順序・rAF→setTimeout)は実装・
> デプロイ済みだが、hydrationエラー自体を止めない限り本質的解決にならないと判明。
> 次に読む人は「2026-09-30 最終結論: 真因は`/sign-in`ページのhydrationエラー」
> 節から読む。

## 2026-09-30 静穏環境での再検証（交絡要因の切り分け完了、最新かつ最重要）

前節の実測は、調査中に同じブランチへ短時間で連続コミット・デプロイしていた最中に
行ったため、観測結果にノイズが混入している可能性を排除できていなかった。
デプロイ完了から5分以上のクールダウンを置いた**静穏な環境**で、新規タブ・
`sessionStorage.clear()`済みの状態から再検証した。

**判明したこと（2つに切り分けられた）**:

1. **React hydrationエラー(#418)は連続デプロイのノイズだった。**
   静穏な環境ではトップページ`/`・`/sign-in`のどちらでも一度も再現しなかった
   （複数回のnavigate/reloadで確認）。連続デプロイ中はサーバーとクライアントで
   異なるビルドのJSが混在し、これがhydrationミスマッチを引き起こしていたと考えられる。
   **この節より前に書いた「hydrationエラーが真因」という仮説は撤回する。**

2. **しかし「自動click後にX認可画面へ遷移しない」症状自体は、静穏な環境でも
   100%再現する。** これは交絡要因ではなく本物の症状と確定した。
   - `sessionStorage['surechigai:auto-x-last-fired-at']`の打刻でclick発火を確認
   - ネットワークログで`GET https://surechigai.kimito.link/sign-in?redirect_url=%2F&auto=x`
     （**`?auto=x`付きの同一URL**）への完全なドキュメントリクエストが**2回発生**することを確認
   - 今回はJSチャンクのファイルハッシュが2回とも同一（`sign-in-0530083ac...js`）だった
     ——これは**CDN/デプロイのノイズではなく、同一ビルドに対して本物のページ再読込が
     2回起きている**ことを意味する

**現在の最有力仮説**: `tryClick()`内の`button.click()`実行が、何らかの理由で
ページ全体の再読込（`?auto=x`付きURLへの2回目のフルナビゲーション）を誘発している。
`removeAutoXParam()`によるURL書き換え（`history.replaceState`）の**直後**に
このリロードが起きるため、ブラウザが古い（`auto=x`付きの）URL状態で再読込してしまい、
結果としてXボタンのclickによるOAuth開始そのものが巻き戻される、という筋が通る。

**まだ特定できていないこと**: 何が実際にこの「フルページ再読込」をトリガーしているか。
Service Worker（ログ未検出で否定済み）・chunk-load-recovery（フラグ未検出で否定済み）
ではない。React Navigation/Expo Routerの`history.replace`実装
（`node_modules/expo-router/build/fork/useLinking.js`・`createMemoryHistory.js`）が
生の`window.history.replaceState`を呼ぶ際、**popstateイベントを人工的に発火させている
箇所が無いか**を次に確認すべき（`RestoreDeepLinkAfterAuthBoot`は今回console.logの
不在で否定済み、別の経路を疑う）。

## 2026-09-30 追加調査（詳細ログでの実測、最重要の追記）

`components/auth/auto-advance-to-x.tsx`の`tryClick()`に一時的なデバッグログ
（`removeAutoXParam()`直後・`button.click()`直後・2秒後、それぞれのURL）を仕込み、
本番(`surechigai.kimito.link`)にデプロイして実測した(コミット`21d876625`、
その後`155cb5bce`で削除済み)。

**確定した事実**:
1. `removeAutoXParam()`は正しく動作しており、`?auto=x`パラメータは実際に除去される
   （ログ: `after removeAutoXParam, url= https://surechigai.kimito.link/sign-in?redirect_url=%2F`）
2. `button.click()`は実際に呼ばれ、ボタンはDOMに接続されたまま
   （`isConnected: true`）
3. **`button.click()`実行の2秒後に発火するはずの`window.setTimeout`コールバックが
   一度も実行されない**（ログが一切出ない、10秒以上待っても出ない）
4. ネットワークログで、`GET https://surechigai.kimito.link/sign-in?redirect_url=%2F&auto=x`
   （**`?auto=x`付きの同一URL**）への完全なドキュメントリクエストが**複数回繰り返されている**
   ことを確認した。1回しかナビゲートしていないにもかかわらず。

**3と4を総合すると**: `button.click()`実行直後、ページ全体が予期せず繰り返しリロードされている
可能性が高い。`window.setTimeout`はページの完全なアンロードで確実にキャンセルされるため、
3の現象と整合する。Service Workerのログ（`[SW] ...`）は一切出ておらず、Service Worker由来の
リロードは否定できた。`chunk-load-recovery.ts`の`tryRecoverFromChunkError`も、
`sessionStorage`に`surechigai.chunkReload.v1`フラグが立っていないことから今回は未発火と確認済み。

★★**重要な未検証の交絡要因**: この実測は、調査中に同じブランチへ短時間で複数回
コミット・デプロイを繰り返していた最中に行った。ネットワークログで観測した
「繰り返しGETリクエスト」の中で`sign-in-*.js`のファイル名ハッシュが変化していたことから、
**Vercelの新しいデプロイが進行中でCDN/クライアント側キャッシュが不安定だった可能性を
排除できていない**。もしこれが原因なら、観測した「ページの繰り返しリロード」は
調査自体が引き起こしたノイズであり、本番の安定状態（デプロイの合間）では再現しない
可能性がある。**次に調べる人は、直近30分以内にこのリポジトリへのpush/デプロイが
無い、完全に静穏な状態で同じ実測をやり直すこと**（デバッグログの再現手順は下記）。

**デバッグログの再現手順**（必要なら`tryClick()`に以下を一時的に追加する。
場所は`didClick = true;`の直後から）:
```ts
console.warn("[DEBUG] button found", button.outerHTML.slice(0, 200));
markFiredNow();
removeAutoXParam();
console.warn("[DEBUG] after removeAutoXParam, url=", window.location.href);
cleanupTimers();
const urlBeforeClick = window.location.href;
button.click();
console.warn("[DEBUG] after click, url=", window.location.href, "isConnected=", button.isConnected);
window.setTimeout(() => console.warn("[DEBUG] 2s after click, url=", window.location.href), 2000);
```
本番デプロイ後、新規タブ・`sessionStorage.clear()`済みの状態で
`/sign-in?redirect_url=%2F&auto=x`へアクセスし、コンソールログとネットワークログ
（`read_network_requests`、`urlPattern: "sign-in"`）の両方を確認する。
「2秒後」のログが出るか、同一URLへの複数回のGETが無いかを見る。

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

## 2026-09-30 最終結論: 真因は`/sign-in`ページのhydrationエラー（実装未着手のまま一旦区切り）

一連の緩和策（click→URLクリーンアップの順序変更・requestAnimationFrame遅延・
setTimeout(fn,0)遅延）をそれぞれ本番デプロイ・実地検証したが、**いずれも症状を
完全には解消できなかった**。最終的に、複数回の実地検証を通じて次の一貫したパターンが
確定した:

1. `/sign-in`ページへの**直接アクセス**（新規タブ・フルページロード）時、
   **ほぼ毎回** React hydrationエラー（Minified React error #418）が発生する。
2. トップページ`/`経由でのクライアントサイドルーティングでの`/sign-in`到達時は、
   hydrationエラーが発生しないことが多い（ただし絶対ではなく、発生した回もある）。
3. hydrationエラーが起きると、Reactがコンポーネントツリーを強制的に再生成する
   （公式仕様: 「As a result this tree will be regenerated on the client」）。
   これにより`AutoAdvanceToX`のuseEffectが不安定なタイミングで再実行され、
   `tryClick()`のクロージャ・`setTimeout`のコールバック等が失われる。
4. `AutoAdvanceToX`自身の`removeAutoXParam()`（`navigateReplace.withUrl`経由、
   React Navigation状態変更を伴う）の呼び出し自体が、**新たなhydrationエラーを
   誘発しているように見える**タイミングも実機ログで観測された
   （`[Navigation] Replacing to: ...`ログの直後に2回目のhydrationエラーが発生）。

### なぜ個別の緩和策が効かなかったか

- **click→URLクリーンアップの順序変更**: hydrationエラー自体は解消しないため、
  順序を変えてもエラー発生・再マウントのタイミング次第で同じ問題が起きる。
- **requestAnimationFrame遅延**: 実地検証で致命的な副作用が判明。**Browser pane
  の検証タブは`document.visibilityState === "hidden"`・`document.hasFocus() ===
  false`の状態で動作しており、rAFコールバックが一度も実行されなかった**
  （ブラウザ標準のrAFスロットリング仕様）。この発見自体は正しい修正
  （setTimeoutへの変更）につながったが、根本のhydration問題は未解決のまま。
- **setTimeout(fn, 0)遅延**: 可視性に依存しない点は正しいが、hydrationエラーに
  よる再マウント自体を防げないため、症状の発生確率を下げた可能性はあるが
  完全解消には至らなかった。

### 次に着手すべきこと（優先順位順）

1. **`app/sign-in.tsx`のhydrationミスマッチの直接原因を特定する。**
   疑わしい箇所:
   - `const [isCallback, setIsCallback] = useState(() => Platform.OS === "web" ?
     isClerkHashSsoCallback() : false)`（useState初期化関数内でのwindow参照）
   - `isAuthReady`の値がSSG時（`app.config.ts`の`web.output: "static"`）と
     クライアント初回レンダー時で一致しているか
   - React本体の開発ビルド（`react-dom`のunminified版）で実際のエラーメッセージ
     全文を取得する（本番は`Minified React error #418`で詳細が読めない。
     `https://react.dev/errors/418?args[]=...`のクエリに実際の差分情報が
     URLエンコードされているはずなので、そこから詳細を読み取れる可能性がある）。
2. **hydrationエラーを止めてから、`AutoAdvanceToX`側の緩和策（今回実装した
   click順序・setTimeout遅延）が有効かを再検証する。** hydrationさえ止まれば、
   現在の実装のままで解決する可能性が高い。
3. hydrationエラーの根絶が難しい場合の代替案として、`AutoAdvanceToX`を
   `useEffect`の再実行に対してより堅牢にする（例: `sessionStorage`ベースの
   クールダウンを「click試行」ではなく「実際のナビゲーション成功」まで
   確認してから設定する、`MutationObserver`を再マウントのたびに使い捨てず
   モジュールレベルで一度だけ設定する等）。ただしこれは対症療法であり、
   基準②「100年メンテナンスのいらない設計」の観点では1が優先されるべき。

### 現状のコード状態（2026-09-30時点でmainにデプロイ済み）

`components/auth/auto-advance-to-x.tsx`は以下の状態:
- `tryClick()`: click実行→`removeAutoXParam()`→`warnIfUrlUnchanged`の順（コミット
  `b71fe50aa`時点）。`setTimeout(fn, 0)`で1タスク遅延させてからclickする。
- `removeAutoXParam()`: `navigateReplace.withUrl()`（expo-router公式APIの
  ラッパー）を使用。`window.history.replaceState`直接呼び出しは廃止済み
  （Expo Router内部状態との不整合を修正するため）。
- タイムアウト（9秒）・click後2秒判定、両方のサイレント失敗可視化
  （`console.warn`）は実装済み・機能確認済み。
