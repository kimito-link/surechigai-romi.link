/**
 * OAuth の戻り値から「ログインが始められなかった」を見分ける。
 *
 * ★2026-08-22 iOS build 521 却下（Guideline 2.1(a)
 *   "Buttons were unresponsive, unable to interact with app." / iPad Air 11-inch M3）の真因。
 *   build 520 で同じ症状が出て修正したのに、**その修正を入れた 521 で再発**した
 *   ＝ 520 の診断が誤りだった。
 *
 * ■ 何が起きていたか
 *   `@clerk/expo` の `startOAuthFlow` は、Clerk がまだ読み込めていないと
 *   **例外を投げずに**空の結果を返して終わる:
 *
 *     if (!isSignInLoaded || !isSignUpLoaded) {
 *       return { createdSessionId: "", signIn, signUp, setActive };
 *     }
 *
 *   呼び出し側は `if (result.createdSessionId && result.setActive)` で受けていたため、
 *   空文字は素通りし、try は正常終了し、catch の Alert も出なかった。
 *   ★**ブラウザも開かず、エラーも出ず、本当に何も起きない。**
 *
 *   さらに `isAuthReadyForUI` は 1000ms で無条件に true になる（authReadyTimeout）ので、
 *   ボタンは「押せる見た目」に戻る。審査員はそれを押して無反応を見た。
 *
 * ■ なぜ 520 の修正で直らなかったか
 *   520 の修正が塞いだのは `useUser().isLoaded` 側の窓。
 *   `startOAuthFlow` が見ているのは `useSignIn()` / `useSignUp()` の `isLoaded` で、
 *   ★**別の信号**だった。
 *
 * ■ 見分け方の根拠（node_modules を実読して確認）
 *   `@clerk/react/dist/legacy.js` の useSignIn は未ロード時に
 *     { isLoaded: false, signIn: undefined, setActive: undefined }
 *   を返す。つまり **createdSessionId が空** かつ **setActive が無い** の同時成立が
 *   「そもそも開始できなかった」の署名になる。
 *   ★利用者が自分で中断した場合は Clerk はロード済みなので `setActive` は生きている。
 *     だからここで誤検知しない（キャンセルをエラー扱いしない）。
 *
 * ■ 直し方の方針
 *   ★ボタンを disabled にする方向では直さない。押せない方が却下より悪い
 *   （2026-08-21 に永久 disabled の詰みを実際に作りかけた）。
 *   押せるままにして、**押した先で見えるエラーを出す**方に倒す。
 */

/** startOAuthFlow / startAppleOAuthFlow の戻り値のうち、判定に使う部分だけ。 */
export type OAuthStartResult = {
  createdSessionId?: string | null;
  setActive?: unknown;
};

/**
 * 「OAuth を開始できないまま無言で戻ってきた」なら true。
 *
 * true のときは throw して、利用者に見えるエラーを出すこと。
 * 握り潰すと「押しても何も起きないボタン」になる（＝却下された状態）。
 */
export function isSilentOAuthNoop(result: OAuthStartResult | null | undefined): boolean {
  if (!result) return true;
  const hasSession = Boolean(result.createdSessionId);
  const hasSetActive = typeof result.setActive === "function";
  // ★セッションも無く setActive も無い ＝ Clerk 未ロードで即返された署名。
  return !hasSession && !hasSetActive;
}

/** 無言で戻ってきたときに利用者へ見せる文言。 */
export const OAUTH_NOT_READY_MESSAGE =
  "ログインの準備がまだ整っていません。通信状況を確認して、もう一度お試しください。";
