/**
 * kimito.link でログインしたあと、アプリ（カスタムスキーム）へ戻すための純粋関数。
 *
 * 外部ブラウザ（Safari / Chrome）へ Linking.openURL すると、ログインが終わっても
 * アプリへ戻れない。認証セッション（iOS は ASWebAuthenticationSession、
 * Android は Chrome Custom Tabs）は、戻り先が `surechigai://...` のときだけ閉じる。
 *
 * Clerk の許可スキームは http/https なので、カスタムスキームを sign-in の
 * redirect_url に直接は渡さない。https の handoff がワンタイム ticket を付けて
 * 302 する。セッションの中の 302 は JS も Web フォントも要らない（Lockdown Mode）。
 */

/** app.config.json identity.iosScheme と揃える。テストで突き合わせる。 */
export const NATIVE_APP_SCHEME = "surechigai";

/** lib/auth/native-redirect.ts の NATIVE_OAUTH_CALLBACK_PATH と揃える。 */
export const NATIVE_AUTH_CALLBACK_PATH = "oauth-native-callback";

export const KIMITO_SIGN_IN_PAGE = "https://kimito.link/sign-in/";

export const NATIVE_AUTH_HANDOFF_PATH = "/api/auth/native-handoff";

export const PRODUCTION_ORIGIN = "https://surechigai.kimito.link";

export function formatNativeReturnUrl(
  scheme: string = NATIVE_APP_SCHEME,
  path: string = NATIVE_AUTH_CALLBACK_PATH,
): string {
  return `${scheme}://${path}`;
}

/**
 * handoff の URL は本番オリジンの固定パスだけ。
 * 渡された origin が違っても、そこへ redirect_url を向けない（オープンリダイレクトにしない）。
 */
export function buildHandoffUrl(origin: string = PRODUCTION_ORIGIN): string {
  const candidate = `${(origin || PRODUCTION_ORIGIN).replace(/\/$/, "")}${NATIVE_AUTH_HANDOFF_PATH}`;
  return isOwnHandoffUrl(candidate) ? candidate : `${PRODUCTION_ORIGIN}${NATIVE_AUTH_HANDOFF_PATH}`;
}

/** https の受け渡し口は、自オリジン + /api/auth/native-handoff だけ。query は tried=1 のみ。 */
export function isOwnHandoffUrl(value: string | null | undefined): boolean {
  const url = parseUrl(value);
  if (!url) return false;
  if (url.origin !== PRODUCTION_ORIGIN) return false;
  if (url.username || url.password || url.port) return false;
  if (url.pathname !== NATIVE_AUTH_HANDOFF_PATH) return false;
  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== "tried")) return false;
  const tried = url.searchParams.get("tried");
  return tried === null || tried === "1";
}

/**
 * ネイティブの戻り先は surechigai://oauth-native-callback だけ。
 * 同じスキームでも別ホスト（surechigai://evil/...）は受け取らない。
 * ticket 以外の query も受け取らない。
 */
export function isOwnNativeCallbackUrl(value: string | null | undefined): boolean {
  const url = parseUrl(value);
  if (!url) return false;
  if (url.protocol !== `${NATIVE_APP_SCHEME}:`) return false;
  if (url.username || url.password || url.port) return false;
  if (url.hostname !== NATIVE_AUTH_CALLBACK_PATH) return false;
  if (url.pathname !== "" && url.pathname !== "/") return false;
  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== "ticket")) return false;
  return true;
}

function parseUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** 未ログインのとき handoff が飛ばす kimito.link のサインイン。redirect は自オリジンの handoff だけ。 */
export function buildKimitoSignInStartUrl(handoffUrl: string): string | null {
  if (!isOwnHandoffUrl(handoffUrl)) return null;
  const url = new URL(KIMITO_SIGN_IN_PAGE);
  url.searchParams.set("redirect_url", handoffUrl);
  return url.toString();
}

export function buildNativeCallbackUrl(returnUrl: string, ticket: string): string | null {
  if (!isOwnNativeCallbackUrl(returnUrl)) return null;
  if (!/^[A-Za-z0-9._-]{8,2048}$/.test(ticket)) return null;
  const url = new URL(returnUrl);
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

/**
 * 認証セッションが返した URL から ticket を取る。
 * http(s) は戻り先として受け取らない（外部ブラウザに残った状態と区別する）。
 */
export function parseTicketFromCallback(callbackUrl: string | null | undefined): string | null {
  if (!callbackUrl) return null;
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return null;
  }
  if (!isOwnNativeCallbackUrl(callbackUrl)) return null;
  const ticket = url.searchParams.get("ticket");
  if (!ticket || !/^[A-Za-z0-9._\-]{8,2048}$/.test(ticket)) return null;
  return ticket;
}

export type HandoffResult =
  | { kind: "redirect"; status: 302; location: string }
  | { kind: "html"; status: 200; html: string }
  | { kind: "error"; status: number; message: string };

const RETRY_HTML_VIEWPORT = "width=device-width, initial-scale=1, viewport-fit=cover";

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 自動リダイレクトを止めたあとに出す、JS も外部フォントも無い案内。 */
export function renderHandoffRetryHtml(signInUrl: string): string {
  const href = escapeAttr(signInUrl);
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="${RETRY_HTML_VIEWPORT}">
<title>ログイン</title>
<style>
  html,body{margin:0;overflow-x:hidden;max-width:100%;background:#F0F4F8;color:#0F172A;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Hiragino Sans","Hiragino Kaku Gothic ProN",Meiryo,sans-serif}
  main{max-width:28rem;margin:0 auto;padding:32px 20px}
  p{font-size:16px;line-height:1.6}
  a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border-radius:14px;background:#00427B;color:#fff;font-weight:700;font-size:16px;text-decoration:none}
</style>
</head>
<body>
<main>
  <p>kimito.link のログインがまだ完了していません。下のボタンから続けると、このアプリへ戻ります。</p>
  <p><a href="${href}">kimito.link でログイン</a></p>
</main>
</body>
</html>`;
}

/**
 * セッションの有無だけで行き先を決める。ticket の発行や Clerk 呼び出しはしない。
 * 戻り先 URL は引数（サーバが組み立てた固定値）だけを使い、リクエスト由来の URL は受けない。
 */
export function decideNativeHandoff(input: {
  userId: string | null;
  tried: boolean;
  ticket: string | null;
  unavailable: boolean;
  handoffUrl: string;
  returnUrl: string;
}): HandoffResult {
  if (input.unavailable) {
    return {
      kind: "error",
      status: 503,
      message: "ログインの受け渡しを準備できませんでした。しばらくしてからもう一度お試しください。",
    };
  }
  if (!isOwnHandoffUrl(input.handoffUrl) || !isOwnNativeCallbackUrl(input.returnUrl)) {
    return {
      kind: "error",
      status: 503,
      message: "ログインの受け渡しを準備できませんでした。しばらくしてからもう一度お試しください。",
    };
  }
  if (!input.userId) {
    const back = input.tried ? input.handoffUrl : `${input.handoffUrl}?tried=1`;
    const signInUrl = buildKimitoSignInStartUrl(back);
    if (!signInUrl) {
      return {
        kind: "error",
        status: 503,
        message: "ログインの受け渡しを準備できませんでした。しばらくしてからもう一度お試しください。",
      };
    }
    if (!input.tried) {
      return { kind: "redirect", status: 302, location: signInUrl };
    }
    return { kind: "html", status: 200, html: renderHandoffRetryHtml(signInUrl) };
  }
  if (!input.ticket || !/^[A-Za-z0-9._\-]{8,2048}$/.test(input.ticket)) {
    return {
      kind: "error",
      status: 503,
      message: "ログインの受け渡しを準備できませんでした。しばらくしてからもう一度お試しください。",
    };
  }
  const callback = buildNativeCallbackUrl(input.returnUrl, input.ticket);
  if (!callback) {
    return {
      kind: "error",
      status: 503,
      message: "ログインの受け渡しを準備できませんでした。しばらくしてからもう一度お試しください。",
    };
  }
  return {
    kind: "redirect",
    status: 302,
    location: callback,
  };
}
