/**
 * Clerk ユーザーオブジェクトから X プロフィールを抽出する（純関数・DB 非依存）。
 */

import { normalizeTwitterUsername } from "./twitter-username.js";

export type ClerkTwitterProfile = {
  twitterUsername: string;
  twitterId: string | null;
  displayName: string | null;
  profileImage: string | null;
};

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * provider 文字列が X(Twitter) を指すか。Clerk の表記ゆれ（oauth_x / oauth_twitter 等）を吸収する。
 * 部分一致にすると "oauth_xero" のような別プロバイダを誤検知するので、区切りで判定する。
 */
function isXProvider(provider: string | null | undefined): boolean {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTwitterProfileFromClerkUser(clerkUser: any): ClerkTwitterProfile | null {
  // X 連携だけを探す。以前は `?? externalAccounts[0]` で「1つ目のアカウント」に
  // フォールバックしていたが、Sign in with Apple を主導線にした(2026-08-05)以降は
  // Apple/Google だけのユーザーが現実に存在するため、その1つ目を X として掴んでしまう。
  // Apple の非公開リレー名などで公開URL(/u/<slug>)や OGP のハンドルが作られると、
  // 本人と無関係の値が公開される。他プロバイダには絶対にフォールバックしない。
  //
  // また、連携が壊れている(verification.status が verified 以外)アカウントは採用しない。
  // 壊れた値で公開URLを作ると「案内どおりログインし直しても直らない」詰み状態になる
  // （kimitolink-linktree で実機再現済み。lib/resolve-x-username.ts と同じ判断）。
  const externalAccount = clerkUser.externalAccounts?.find?.(
    (account: { provider?: string; verification?: { status?: string | null } | null }) => {
      if (!isXProvider(account?.provider)) return false;
      const status = account?.verification?.status;
      return !status || status === "verified";
    },
  );

  const username = normalizeTwitterUsername(
    firstString(
      // X 連携側のハンドルを最優先する。clerkUser.username は「そのアプリのユーザー名」で、
      // 後から別の X アカウントで入り直しても更新されないことがあり、切り替えに追従しない。
      externalAccount?.username,
      externalAccount?.handle,
      externalAccount?.screenName,
      // 以下は X 連携が取れなかったときの従来値（手動設定を尊重）。
      // externalAccount が無いケースでのみ効く。
      clerkUser.username,
      clerkUser.publicMetadata?.username,
      clerkUser.unsafeMetadata?.username,
    ),
  );
  if (!username) return null;

  const twitterId = firstString(
    externalAccount?.providerUserId,
    externalAccount?.externalId,
    clerkUser.publicMetadata?.twitterId,
    clerkUser.unsafeMetadata?.twitterId,
  );

  const displayName = firstString(
    clerkUser.fullName,
    externalAccount?.firstName && externalAccount?.lastName
      ? `${externalAccount.firstName} ${externalAccount.lastName}`
      : undefined,
    externalAccount?.username,
  );

  const profileImage = firstString(
    clerkUser.imageUrl,
    externalAccount?.imageUrl,
    externalAccount?.picture,
  );

  return {
    twitterUsername: username,
    twitterId: twitterId ?? null,
    displayName: displayName ?? null,
    profileImage: profileImage ?? null,
  };
}

export function extractClerkUserIdFromOpenId(openId: string): string | null {
  const m = /^clerk:(.+)$/.exec(openId);
  return m?.[1] ?? null;
}
