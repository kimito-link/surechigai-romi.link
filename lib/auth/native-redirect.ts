/**
 * ネイティブ OAuth の戻り先（redirectUrl）を決める。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★iOS build 533 却下（Guideline 2.1(a)・2026-08-29）の真因
 *
 *   審査コメント:
 *     "the login methods provided in the app both do not function as it displays an error"
 *   審査端末: iPhone 17 Pro Max / iPad Air 11-inch (M3)
 *
 *   却下時のコード:
 *     const redirectUrl = `${getApiBaseUrl()}/oauth/twitter-callback`;
 *   ネイティブでは getApiBaseUrl() が本番URLを返すため、
 *   ★`https://surechigai.kimito.link/oauth/twitter-callback` が渡っていた。
 *
 * ■ ★なぜ https だと壊れるか（Expo 公式の制約）
 *   startOAuthFlow は内部で WebBrowser.openAuthSessionAsync(url, redirectUrl) を呼ぶ。
 *   iOS ではこの第2引数が ASWebAuthenticationSession の callbackURLScheme になり、
 *   ★**カスタムスキームしか一致しない**。
 *
 *   > "the redirect URI ... has to use the protocol provided as the scheme in
 *   >  app.json expo.scheme. For example, `demo://` not `https://` protocol."
 *   https://docs.expo.dev/versions/latest/sdk/webbrowser/
 *
 *   ⟹ https を渡すと戻り先が永久に一致せず、★ブラウザが開いたまま返ってこない
 *     （expo/expo#19708 で同症状が報告されている）。
 *
 * ■ ★「エラーが出る」の正体（自分の実装が出していた）
 *   審査員が閉じると authSessionResult.type !== "success" となり、
 *   useOAuth は `createdSessionId: ""` を返す。
 *   すると 2026-08-22 に入れた isSilentOAuthNoop() のガードが拾って
 *   OAUTH_NOT_READY_MESSAGE を throw し、Alert が出る。
 *
 *   ★つまり審査員が見た「エラー」は、こちらが出したもの。
 *   ★ガードは正しく働いている（無反応→見えるエラーへの変換が目的）。消してはいけない。
 *   ★ただしガードのコメントは原因を「Clerk 未ロード」と書いており、それは**誤り**だった。
 *     どちらの経路も同じ空文字を返すので、ガードでは区別できない。
 *
 * ■ ★なぜ X と Apple の「両方」が落ちたか
 *   両者は redirectUrl を共有している（provider で分岐するのは strategy だけ）。
 *   ★1つの設定ミスで両方同時に壊れる。審査コメントの "both" と一致する。
 *
 * ■ ★このファイルを分けた理由
 *   clerk-auth-bridge.tsx に新しい import を足すと Metro のチャンク分割が変わり、
 *   2026-07-31 に本番の /sign-in が
 *   「useUser can only be used within the <ClerkProvider />」で壊れた実績がある。
 *   ★純粋関数として切り出し、テストできる形にする。
 *
 * 出典:
 *   - https://clerk.com/docs/reference/expo/native-hooks/use-oauth
 *   - https://docs.expo.dev/versions/latest/sdk/auth-session/
 *   - https://docs.expo.dev/versions/latest/sdk/webbrowser/
 * ───────────────────────────────────────────────────────────────────────────
 */
import appConfig from "@/app.config.json";

/* ★expo-auth-session はトップレベルで import しない（2026-08-29）。
   vitest が解析できず「Expected 'from', got 'typeOf'」でテストファイルごと落ちる。
   ★純粋関数（isValidNativeRedirectUrl）はテストで守りたいので、
   ネイティブ専用の依存は実際に呼ぶ関数の中だけに閉じ込める。 */

/** OAuth 後に戻ってくるパス。Clerk Dashboard の Native applications に登録した値と揃える。 */
export const NATIVE_OAUTH_CALLBACK_PATH = "oauth-native-callback";

/**
 * ★https を戻り先に使っていないか判定する（純粋関数・テスト用）。
 *
 * ネイティブの戻り先は必ずカスタムスキーム。
 * 「http(s) で始まっていたら誤り」という一点だけを見る。
 */
export function isValidNativeRedirectUrl(url: string): boolean {
  if (!url) return false;
  return !/^https?:\/\//i.test(url);
}

/**
 * ★戻り先の**文字列そのもの**を組み立てる（純粋関数・テストの正本）。
 *
 * expo-linking の createURL は `${scheme}:${isTripleSlashed ? '/' : ''}/${hostUri}${path}`
 * を組む。buildNativeOAuthRedirectUrl は isTripleSlashed を渡していないので既定 false、
 * かつスタンドアロン（カスタムスキームあり）では hostUri が空になる。
 * ⟹ 出来上がりは **スラッシュ2本**の `surechigai://oauth-native-callback`。
 *
 * ★なぜ別に持つか: makeRedirectUri は expo-auth-session を必要とし、
 *   vitest から呼べない（トップレベル import できない事情は下の注記のとおり）。
 *   ★ここを「登録すべき文字列は何か」の正本にして、テストで固定する。
 *   ★Clerk Dashboard / allowed_origins に登録する値と**必ず同じ**にすること。
 *   スラッシュの本数が違うと戻り先が一致せず、533 と同じ却下に戻る。
 */
export function formatNativeRedirectUrl(scheme: string, path: string): string {
  return `${scheme}://${path}`;
}

/** ★このアプリが実際に使う戻り先（登録値の正本）。 */
export function getNativeOAuthRedirectUrl(): string {
  return formatNativeRedirectUrl(appConfig.identity.iosScheme, NATIVE_OAUTH_CALLBACK_PATH);
}

/**
 * ネイティブ OAuth の戻り先を作る。
 *
 * ★scheme は app.config.json の identity.iosScheme（＝ app.config.ts が
 *   expo の scheme に渡している値）と同じものを使う。ハードコードしない。
 */
export function buildNativeOAuthRedirectUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AuthSession = require("expo-auth-session") as typeof import("expo-auth-session");
  return AuthSession.makeRedirectUri({
    scheme: appConfig.identity.iosScheme,
    path: NATIVE_OAUTH_CALLBACK_PATH,
  });
}
