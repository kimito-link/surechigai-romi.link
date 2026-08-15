/**
 * lib/encounter-notice.ts
 *
 * 「新しいすれちがいが届いた」ことをアプリ内で知らせるための判定と受け渡し。
 *
 * ★なぜ OS のプッシュ通知ではないのか（2026-08-15 の設計判断）:
 *   ユーザーの要求は「近づいたら通知。ただし電池を消耗しない形で」だった。
 *   アプリを開いている間だけで良いと確認できたので、
 *   - 新しい位置取得を1つも作らない（既存 presence.pulse に相乗り）
 *   - OS の通知権限を要求しない（＝Play の権限申告に一切触れない。
 *     過去に FOREGROUND_SERVICE_MEDIA_PLAYBACK で用途説明の動画提出まで
 *     要求されて詰まった実績があるため、権限は増やさないのが最も安い）
 *   という形に落とした。表示は既存のアプリ内トーストを使う。
 *
 * ★なぜ「件数」だけで判定しないのか:
 *   pulse は60秒ごとに来る。件数だけを見ると同じすれ違いで毎分鳴り続ける。
 *   encounters.id は単調増加なので、latestId が前回通知時より進んだときだけ鳴らす。
 *   逆に「開封して件数が減った」場合は latestId が進まないので鳴らない。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UnopenedSummary = { count: number; latestId: number };

const ENABLED_KEY = "surechigai.encounterNotice.enabled.v1";
const LAST_NOTIFIED_ID_KEY = "surechigai.encounterNotice.lastNotifiedId.v1";

/** 通知が有効か。未保存・壊れた値なら既定 ON（体験の主機能なので opt-out にする） */
export async function readNoticeEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ENABLED_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export async function writeNoticeEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, value ? "true" : "false");
  } catch {
    // 保存できなくても通知自体は動く（既定 ON のまま）
  }
}

async function readLastNotifiedId(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LAST_NOTIFIED_ID_KEY);
    const parsed = raw != null ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

/**
 * 通知すべきなら summary を返し、既読位置（lastNotifiedId）を進める。
 * 鳴らさない場合は null を返し、既読位置は動かさない。
 *
 * OFF のときに既読位置を進めてはいけない: ON に戻したときに、
 * OFF 中に届いていた分を取りこぼすため。
 */
export async function consumeNotifiableSummary(
  summary: UnopenedSummary,
): Promise<UnopenedSummary | null> {
  if (summary.count <= 0) return null;

  const enabled = await readNoticeEnabled();
  if (!enabled) return null;

  const lastNotifiedId = await readLastNotifiedId();
  if (summary.latestId <= lastNotifiedId) return null;

  try {
    await AsyncStorage.setItem(LAST_NOTIFIED_ID_KEY, String(summary.latestId));
  } catch {
    // 保存に失敗した場合は次回また鳴る（鳴らないより鳴りすぎる方を選ぶ）
  }
  return summary;
}

/* ------------------------------------------------------------------ *
 * pulse（位置の常駐監視）から、表示側（トースト）へ値を渡すための最小の購読機構。
 * 新しいポーリングや Context を増やさないために、モジュールスコープの
 * リスナー集合だけで済ませる。
 * ------------------------------------------------------------------ */

type Listener = (summary: UnopenedSummary) => void;

const listeners = new Set<Listener>();

export function publishUnopenedSummary(summary: UnopenedSummary): void {
  for (const listener of listeners) {
    try {
      listener(summary);
    } catch {
      // 表示側の失敗で pulse を巻き込まない
    }
  }
}

export function subscribeUnopenedSummary(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
