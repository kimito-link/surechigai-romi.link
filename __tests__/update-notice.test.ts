/**
 * 更新 / 新しい内容の通知判定と、許可・チャネルが実際に呼ばれること。
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  decideUpdateNotice,
  notificationTriggerFor,
  readCommitSha,
  updateCheckUrl,
  updateNoticeCopy,
} from "@/shared/update-notice";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

describe("Android の通知チャネル", () => {
  it("即時通知は Android だけ channelId を trigger に載せる", () => {
    expect(notificationTriggerFor("android", null, "updates")).toEqual({ channelId: "updates" });
    expect(notificationTriggerFor("ios", null, "updates")).toBeNull();
    expect(notificationTriggerFor("android", undefined, "updates")).toEqual({ channelId: "updates" });
  });

  it("日付トリガーにも Android だけ channelId を足す", () => {
    const date = new Date("2026-10-25T00:00:00Z");
    const trigger = { type: "date" as const, date };
    expect(notificationTriggerFor("android", trigger, "updates")).toEqual({
      type: "date",
      date,
      channelId: "updates",
    });
    expect(notificationTriggerFor("ios", trigger, "updates")).toEqual(trigger);
    expect(notificationTriggerFor("android", { channelId: "custom" }, "updates")).toEqual({
      channelId: "custom",
    });
  });
});

describe("更新通知の判定", () => {
  it("初回（比較対象が無い）は通知しない", () => {
    const decision = decideUpdateNotice({
      expo: "unsupported",
      expoAlreadyNotified: false,
      previousSha: null,
      embeddedSha: null,
      remoteSha: SHA_A,
    });
    expect(decision.notify).toBe(false);
    expect(decision.nextSha).toBe(SHA_A);
  });

  it("commitSha が変わったら新しい内容として通知する", () => {
    const decision = decideUpdateNotice({
      expo: "unsupported",
      expoAlreadyNotified: false,
      previousSha: SHA_A,
      embeddedSha: null,
      remoteSha: SHA_B,
    });
    expect(decision.notify).toBe(true);
    expect(decision.reason).toBe("revision");
    expect(updateNoticeCopy("revision").title).toContain("新しい内容");
    expect(updateNoticeCopy("revision").body).toContain("すれ違ひ");
  });

  it("同じ SHA では通知しない", () => {
    const decision = decideUpdateNotice({
      expo: "unsupported",
      expoAlreadyNotified: false,
      previousSha: SHA_A,
      embeddedSha: SHA_A,
      remoteSha: SHA_A,
    });
    expect(decision.notify).toBe(false);
  });

  it("取得に失敗したら前回の SHA を消さない", () => {
    const decision = decideUpdateNotice({
      expo: "unsupported",
      expoAlreadyNotified: false,
      previousSha: SHA_A,
      embeddedSha: null,
      remoteSha: null,
    });
    expect(decision.notify).toBe(false);
    expect(decision.nextSha).toBe(SHA_A);
  });

  it("expo-updates が更新ありなら一度だけ通知する", () => {
    const first = decideUpdateNotice({
      expo: "available",
      expoAlreadyNotified: false,
      previousSha: SHA_A,
      embeddedSha: null,
      remoteSha: SHA_A,
    });
    expect(first.notify).toBe(true);
    expect(first.reason).toBe("expo-update");
    expect(first.nextExpoNotified).toBe(true);
    expect(updateNoticeCopy("expo-update").title).toContain("更新");

    const second = decideUpdateNotice({
      expo: "available",
      expoAlreadyNotified: true,
      previousSha: SHA_A,
      embeddedSha: null,
      remoteSha: SHA_A,
    });
    expect(second.notify).toBe(false);
  });

  it("埋め込み SHA が配信と違えば、保存が無くても通知する", () => {
    const decision = decideUpdateNotice({
      expo: "none",
      expoAlreadyNotified: false,
      previousSha: null,
      embeddedSha: SHA_A,
      remoteSha: SHA_B,
    });
    expect(decision.notify).toBe(true);
    expect(decision.reason).toBe("revision");
    expect(decision.nextExpoNotified).toBe(false);
  });

  it("version.json の commitSha 以外は無視する", () => {
    expect(readCommitSha({ commitSha: SHA_A })).toBe(SHA_A);
    expect(readCommitSha({ commitSha: "unknown" })).toBeNull();
    expect(readCommitSha(null)).toBeNull();
    expect(updateCheckUrl(null)).toBe("https://surechigai.kimito.link/version.json");
    expect(updateCheckUrl("https://surechigai.kimito.link")).toBe(
      "https://surechigai.kimito.link/version.json",
    );
    expect(updateCheckUrl("http://localhost:8081")).toBe("https://surechigai.kimito.link/version.json");
  });

  it("ネイティブは許可・Android チャネル・登録を起動時に呼ぶ", () => {
    const push = code("lib/push-notifications.ts");
    const host = read("components/providers/update-notification-host.tsx");
    const native = code("lib/notifications/native-update-notice.ts");
    expect(push).toContain("requestPermissionsAsync");
    expect(push).toContain("setNotificationChannelAsync");
    expect(push).toContain("notificationTriggerFor");
    expect(push).not.toContain("channelId: UPDATE_CHANNEL_ID }");
    expect(push).toContain("resolveExpoProjectId");
    expect(native).toContain("registerForPushNotifications");
    expect(native).toContain("scheduleLocalNotification");
    expect(native).toContain('return "unsupported"');
    expect(native).not.toContain("expo-updates");
    expect(read("package.json")).not.toContain("expo-updates");
    expect(host).toContain("checkNativeUpdateNotice");
    expect(host).toContain('Platform.OS === "web"');
    const layout = read("app/_layout.tsx");
    expect(layout).toContain("UpdateNotificationHost");
    const config = read("app.config.ts");
    expect(config).toContain(read("lib/push-notifications.ts").match(/EAS_PROJECT_ID_FALLBACK = "([^"]+)"/)?.[1] ?? "missing");
  });
});
