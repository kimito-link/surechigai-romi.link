/**
 * 「アプリの更新」と「新しい内容」を通知するかどうか。副作用なし。
 *
 * expo-updates がバイナリに入っていればそれを優先する（未導入なら unsupported）。
 * 入っていないときは、配信中の version.json の commitSha が前回見た値と
 * 違うことを「新しい内容が届いた」とみなす。初回（比較対象が無い）は通知しない。
 */

export type ExpoUpdateState = "available" | "none" | "unsupported";

export type UpdateNoticeReason = "expo-update" | "revision";

export type UpdateDecision = {
  notify: boolean;
  reason: UpdateNoticeReason | null;
  nextSha: string | null;
  nextExpoNotified: boolean;
};

export const UPDATE_NOTICE_SHA_KEY = "update_notice_seen_sha";
export const UPDATE_NOTICE_EXPO_KEY = "update_notice_expo_flag";

/**
 * Android 8+ は即時通知でも channelId を trigger に載せないと捨てる。
 * iOS の即時は null。日付トリガーへ channelId を混ぜると iOS 側の意味が変わるので付けない。
 */
export function notificationTriggerFor(
  platform: string,
  trigger: object | null | undefined,
  channelId: string,
): object | null {
  if (platform !== "android") return trigger ?? null;
  if (trigger == null) return { channelId };
  const current = trigger as { channelId?: unknown };
  if (typeof current.channelId === "string" && current.channelId.length > 0) return trigger;
  return { ...current, channelId };
}

export const PRODUCTION_VERSION_URL = "https://surechigai.kimito.link/version.json";

export function updateCheckUrl(origin: string | null | undefined): string {
  if (origin && /^https:\/\/[^/]+$/i.test(origin)) {
    return `${origin}/version.json`;
  }
  return PRODUCTION_VERSION_URL;
}

export function realCommitSha(value: string | null | undefined): string | null {
  if (!value || value === "unknown") return null;
  return /^[0-9a-f]{7,40}$/i.test(value) ? value : null;
}

export function readCommitSha(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const sha = (payload as { commitSha?: unknown }).commitSha;
  return typeof sha === "string" ? realCommitSha(sha) : null;
}

export function decideUpdateNotice(input: {
  expo: ExpoUpdateState;
  expoAlreadyNotified: boolean;
  previousSha: string | null;
  embeddedSha: string | null;
  remoteSha: string | null;
}): UpdateDecision {
  const nextSha = input.remoteSha ?? input.previousSha;
  const expoNotify = input.expo === "available" && !input.expoAlreadyNotified;
  const baseline = input.previousSha ?? realCommitSha(input.embeddedSha);
  const revisionNotify = Boolean(input.remoteSha && baseline && baseline !== input.remoteSha);
  const notify = expoNotify || revisionNotify;
  let nextExpoNotified = input.expoAlreadyNotified;
  if (input.expo === "available") nextExpoNotified = true;
  if (input.expo === "none") nextExpoNotified = false;
  return {
    notify,
    reason: !notify ? null : expoNotify ? "expo-update" : "revision",
    nextSha,
    nextExpoNotified,
  };
}

export function updateNoticeCopy(reason: UpdateNoticeReason): { title: string; body: string } {
  if (reason === "expo-update") {
    return {
      title: "アプリの更新があります",
      body: "新しい内容を読み込めます。アプリを開いて確認してください。",
    };
  }
  return {
    title: "新しい内容が届きました",
    body: "すれ違ひ通信に更新があります。開いて確認できます。",
  };
}
