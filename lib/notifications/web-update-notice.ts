/**
 * ホーム画面に追加した PWA（iOS / Android）で、新しい内容を通知する。
 * 通常のブラウザタブでは出さない。システムフォント以外は使わない。
 */
import { Platform } from "react-native";
import {
  UPDATE_NOTICE_SHA_KEY,
  decideUpdateNotice,
  readCommitSha,
  updateCheckUrl,
  updateNoticeCopy,
} from "@/shared/update-notice";

type WebNotificationCtor = {
  permission: string;
  requestPermission: () => Promise<string>;
  new (title: string, options?: { body?: string }): unknown;
};

type InstalledWebWindow = {
  matchMedia?: (query: string) => { matches: boolean };
  localStorage?: { getItem(key: string): string | null; setItem(key: string, value: string): void };
  location?: { protocol: string; origin: string };
  navigator?: { standalone?: boolean };
  Notification?: WebNotificationCtor;
};

function installedWindow(): InstalledWebWindow | null {
  if (typeof window === "undefined") return null;
  return window as unknown as InstalledWebWindow;
}

function isInstalledApp(win: InstalledWebWindow): boolean {
  if (typeof win.matchMedia !== "function") return false;
  try {
    const standalone = win.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = win.navigator?.standalone === true;
    return standalone || iosStandalone;
  } catch {
    return false;
  }
}

export async function checkWebUpdateNotice(): Promise<void> {
  if (Platform.OS !== "web") return;
  const win = installedWindow();
  if (!win || !isInstalledApp(win)) return;

  const Notifier = win.Notification;
  if (!Notifier) return;

  let previousSha: string | null = null;
  try {
    previousSha = win.localStorage?.getItem(UPDATE_NOTICE_SHA_KEY) ?? null;
  } catch {
    previousSha = null;
  }

  let remoteSha: string | null = null;
  try {
    const origin = win.location?.protocol === "https:" ? win.location.origin : null;
    const res = await fetch(updateCheckUrl(origin), { cache: "no-store" });
    if (res.ok) remoteSha = readCommitSha(await res.json());
  } catch {
    remoteSha = null;
  }

  const decision = decideUpdateNotice({
    expo: "unsupported",
    expoAlreadyNotified: false,
    previousSha,
    embeddedSha: process.env.EXPO_PUBLIC_GIT_SHA ?? process.env.EXPO_PUBLIC_BUILD_SHA ?? null,
    remoteSha,
  });

  if (decision.nextSha) {
    try {
      win.localStorage?.setItem(UPDATE_NOTICE_SHA_KEY, decision.nextSha);
    } catch {
      /* 保存できなくても通知の判断は済んでいる */
    }
  }

  if (!decision.notify || !decision.reason) return;

  try {
    if (Notifier.permission === "default") {
      const permission = await Notifier.requestPermission();
      if (permission !== "granted") return;
    }
    if (Notifier.permission !== "granted") return;
    const copy = updateNoticeCopy(decision.reason);
    new Notifier(copy.title, { body: copy.body });
  } catch {
    /* Lockdown Mode などで Notification が塞がれていても、画面自体は壊さない */
  }
}
