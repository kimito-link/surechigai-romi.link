/** kimito.link 公開プロフィール（例: https://kimito.link/streamerfunch/） */
import { shareUserUrl } from "@/lib/site-urls";

export function buildKimitoPublicProfileUrl(username: string): string {
  const clean = username.replace(/^@/, "").trim();
  return `https://kimito.link/${encodeURIComponent(clean)}/`;
}

/** すれ違ひ通信の共有地図（例: https://surechigai.kimito.link/u/abc123） */
export function buildSurechigaiShareUrl(shareSlug: string): string {
  return shareUserUrl(shareSlug);
}

/** 表示用に kimito.link のパスだけ返す（例: kimito.link/streamerfunch/） */
export function formatKimitoLinkLabel(username: string): string {
  const clean = username.replace(/^@/, "").trim();
  return `kimito.link/${clean}/`;
}
