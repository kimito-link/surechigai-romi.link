/**
 * lib/resolve-x-username.ts
 *
 * ログイン中ユーザーの「X(Twitter) ユーザー名」を決める純粋関数。
 *
 * なぜ必要か（2026-08-05・Sign in with Apple 導入に伴う実害）:
 * 公開ページ /u/<slug> と OGP のハンドル表示は X のアカウント情報に依存する。
 * 一方 Guideline 4.8 対応で Apple ログインを主導線に格上げしたため、
 * **X を一度も連携していないユーザー**が現実に存在するようになった。
 *
 * このとき、
 *   - `clerkUser.username` は「そのアプリのユーザー名」であって X の screen_name とは限らない。
 *     後から別の X アカウントで入り直しても更新されないことがあり、切り替えに追従しない。
 *   - `externalAccounts[0]` に倒すと、Apple/Google だけのユーザーの Apple アカウントを
 *     X として掴む。Apple の非公開リレー名で公開URLが作られると本人と無関係の値が公開される。
 *   - 連携が壊れている（verification.status が verified 以外）アカウントを「あり」と数えると、
 *     詰んでいる本人から救済導線が消える。案内どおりログインし直しても直らない状態になる。
 *
 * 同じ症状は kimitolink-linktree で実機再現・修正済み（同名の関数がある）。設計を揃えている。
 *
 * 優先順位:
 *   1. externalAccounts の X/Twitter プロバイダの username（実際にログインした X アカウント）
 *   2. clerkUser.username（X 連携が無いユーザーや手動設定を尊重）
 *   3. null（＝公開ページを作れない。救済導線を出す）
 */

/** Clerk の externalAccount のうち、この関数が必要とする最小形。 */
export type ExternalAccountLike = {
  /** "oauth_x" / "oauth_twitter" / "x" / "twitter" などプロバイダ識別子 */
  provider?: string | null;
  /** プロバイダ側のユーザー名（X の screen_name） */
  username?: string | null;
  /** 連携が壊れている場合は verification.status が "verified" 以外になる */
  verification?: { status?: string | null } | null;
};

export type ResolveXUsernameInput = {
  username?: string | null;
  externalAccounts?: ExternalAccountLike[] | null;
};

/**
 * provider 文字列が X(Twitter) を指すか。Clerk の表記ゆれ（oauth_x / oauth_twitter 等）を吸収する。
 * 部分一致にすると "oauth_xero" のような別プロバイダを誤検知するので、区切りで判定する。
 */
export function isXProvider(provider: string | null | undefined): boolean {
  if (!provider) return false;
  const p = provider.toLowerCase();
  return (
    p === "x" ||
    p === "twitter" ||
    p === "oauth_x" ||
    p === "oauth_twitter" ||
    p.endsWith("_x") ||
    p.endsWith("_twitter")
  );
}

/** X の username として妥当か（@ 付き・空白・URL 混入を弾く）。 */
function normalizeHandle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/^@+/, "");
  const m = s.match(/(?:x\.com|twitter\.com)\/([^/?#\s]+)/i);
  if (m) s = m[1];
  // X のハンドルは英数字と _ のみ・1〜15文字。表示名などが紛れ込む事故を防ぐ。
  if (!/^[A-Za-z0-9_]{1,15}$/.test(s)) return null;
  return s;
}

/** X ユーザー名を解決する。取れなければ null（＝救済導線を出す）。 */
export function resolveXUsername(input: ResolveXUsernameInput): string | null {
  const accounts = Array.isArray(input.externalAccounts) ? input.externalAccounts : [];

  for (const acc of accounts) {
    if (!isXProvider(acc?.provider)) continue;
    // 壊れた連携の値で公開URLを作らない。
    const status = acc?.verification?.status;
    if (status && status !== "verified") continue;
    const handle = normalizeHandle(acc?.username);
    if (handle) return handle;
  }

  return normalizeHandle(input.username);
}

/**
 * X 連携が無い＝公開ページを作れない状態か。
 * 救済導線（「X をつなげる」案内）を出すかどうかの判定に使う。
 */
export function needsXLinkRescue(input: ResolveXUsernameInput): boolean {
  return resolveXUsername(input) === null;
}
