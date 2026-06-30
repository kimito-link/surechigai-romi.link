import { color, palette } from "@/theme/tokens";

export type EncounterItem = {
  id: number;
  partnerId: number;
  partnerName: string | null;
  partnerHitokoto: string | null;
  tier: number;
  areaName: string | null;
  prefecture: string | null;
  occurredAt: Date;
  openedByMe: Date | null;
  partnerTotalEncounters: number;
  partnerUsername?: string | null;
  partnerDisplayName?: string | null;
  partnerProfileImage?: string | null;
  partnerFollowersCount?: number | null;
};

export const TIER_LABELS: Record<number, string> = {
  1: "すれすれ",
  2: "ちかい",
  3: "出会い",
  4: "同担",
  5: "運命",
};

export const TIER_COLORS: Record<number, string> = {
  1: palette.gray400,
  2: color.teal500,
  3: color.accentPrimary,
  4: color.accentAlt,
  5: "#F59E0B",
};

export const STAMPS = ["👋", "🎉", "💫", "🌟"] as const;

export function reasonLabel(reason: string): string {
  switch (reason) {
    case "inappropriate_hitokoto":
      return "不適切なひとことを通報";
    case "spam":
      return "スパムとして通報";
    case "harassment":
      return "嫌がらせとして通報";
    default:
      return "その他の理由で通報";
  }
}

export function formatEncounterDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "たった今";
  if (h < 24) return `${h}時間前`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}日前`;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
