/**
 * kimito.link のログインを、アプリ内の認証セッションで開く。
 *
 * iOS: expo-web-browser が ASWebAuthenticationSession を使う（callbackURLScheme = surechigai）。
 * Android: 同じ API が Chrome Custom Tabs を使う。
 * どちらも第2引数のカスタムスキームへ 302 された瞬間にシートが閉じ、アプリへ戻る。
 *
 * preferEphemeralSession: false は、Safari / Chrome に残っている kimito.link の
 * ログインを共有するため。既にログイン済みなら handoff が JS 無しの 302 だけで戻る
 * （Lockdown Mode でも、埋め込み WebView の Clerk JS に依存しない）。
 *
 * Linking.openURL は使わない。使うと外部ブラウザのまま戻ってこない。
 */
import { getApiBaseUrl } from "@/lib/api/config";
import { getNativeOAuthRedirectUrl, isValidNativeRedirectUrl } from "@/lib/auth/native-redirect";
import { buildHandoffUrl, PRODUCTION_ORIGIN } from "@/shared/kimito-native-auth";

export type KimitoAuthSessionResult = {
  type: string;
  url: string | null;
};

export async function openKimitoAuthSession(): Promise<KimitoAuthSessionResult> {
  const returnUrl = getNativeOAuthRedirectUrl();
  if (!isValidNativeRedirectUrl(returnUrl)) {
    throw new Error("アプリへ戻るアドレスが不正です。");
  }

  const WebBrowser = require("expo-web-browser") as typeof import("expo-web-browser");
  if (typeof WebBrowser.maybeCompleteAuthSession === "function") {
    WebBrowser.maybeCompleteAuthSession();
  }

  const origin = getApiBaseUrl() || PRODUCTION_ORIGIN;
  const startUrl = buildHandoffUrl(origin);
  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, {
    preferEphemeralSession: false,
    showInRecents: false,
  });

  return {
    type: result.type,
    url: result.type === "success" && "url" in result ? result.url : null,
  };
}
