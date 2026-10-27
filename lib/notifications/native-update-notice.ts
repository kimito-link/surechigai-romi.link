/**
 * iOS / Android で、更新または新しい内容が届いたらローカル通知を出す。
 *
 * expo-updates はこのアプリの依存に入っていない。ここで require すると
 * Metro が解決に失敗するので、配信中の version.json の commitSha 差分で
 * 「新しい内容」を通知する。許可・チャネル・トークン登録は lib/push-notifications.ts。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { scheduleLocalNotification, registerForPushNotifications } from "@/lib/push-notifications";
import {
  UPDATE_NOTICE_EXPO_KEY,
  UPDATE_NOTICE_SHA_KEY,
  decideUpdateNotice,
  readCommitSha,
  updateCheckUrl,
  updateNoticeCopy,
  type ExpoUpdateState,
} from "@/shared/update-notice";

/**
 * expo-updates は依存に入っていない。未導入のバイナリで require すると
 * Metro が解決に失敗する。判定側は "available" を受けられるので、
 * 依存を足したあとにここへ checkForUpdateAsync の結果を渡せば足りる。
 */
async function readExpoUpdateState(): Promise<ExpoUpdateState> {
  return "unsupported";
}

async function readRemoteSha(): Promise<string | null> {
  try {
    const res = await fetch(updateCheckUrl(null), { cache: "no-store" });
    if (!res.ok) return null;
    return readCommitSha(await res.json());
  } catch {
    return null;
  }
}

let inFlight: Promise<void> | null = null;

export function checkNativeUpdateNotice(): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  if (inFlight) return inFlight;
  inFlight = run().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(): Promise<void> {
  await registerForPushNotifications();

  const [previousSha, expoFlag, expo, remoteSha] = await Promise.all([
    AsyncStorage.getItem(UPDATE_NOTICE_SHA_KEY),
    AsyncStorage.getItem(UPDATE_NOTICE_EXPO_KEY),
    readExpoUpdateState(),
    readRemoteSha(),
  ]);

  const decision = decideUpdateNotice({
    expo,
    expoAlreadyNotified: expoFlag === "1",
    previousSha,
    embeddedSha: process.env.EXPO_PUBLIC_GIT_SHA ?? process.env.EXPO_PUBLIC_BUILD_SHA ?? null,
    remoteSha,
  });

  if (decision.nextSha && decision.nextSha !== previousSha) {
    await AsyncStorage.setItem(UPDATE_NOTICE_SHA_KEY, decision.nextSha);
  }
  await AsyncStorage.setItem(UPDATE_NOTICE_EXPO_KEY, decision.nextExpoNotified ? "1" : "0");

  if (!decision.notify || !decision.reason) return;
  const copy = updateNoticeCopy(decision.reason);
  await scheduleLocalNotification(copy.title, copy.body, { kind: decision.reason });
}
