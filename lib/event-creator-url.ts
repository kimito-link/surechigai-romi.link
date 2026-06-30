import { normalizeTwitterUsername } from "@/lib/twitter-username";

/** 主催者の X プロフィール URL */
export function buildCreatorXUrl(
  username?: string | null,
  xId?: string | null,
): string | null {
  const clean = username ? normalizeTwitterUsername(username) : null;
  if (clean) return `https://x.com/${clean}`;
  if (xId) return `https://x.com/i/user/${xId}`;
  return null;
}
