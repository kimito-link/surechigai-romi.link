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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTwitterProfileFromClerkUser(clerkUser: any): ClerkTwitterProfile | null {
  const externalAccount =
    clerkUser.externalAccounts?.find?.((account: { provider?: string }) =>
      ["oauth_x", "oauth_twitter", "twitter", "x"].includes(account.provider ?? ""),
    ) ?? clerkUser.externalAccounts?.[0];

  const username = normalizeTwitterUsername(
    firstString(
      externalAccount?.username,
      externalAccount?.handle,
      externalAccount?.screenName,
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
