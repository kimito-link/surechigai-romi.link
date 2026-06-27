/**
 * modules/event/core/status.ts
 *
 * イベントの状態遷移ロジック（純TS・DB非依存・サービス非依存）。
 * 会議の合意: 「予定 → ライブ中 → 終了」を、時刻と本人操作の両方で遷移させる。
 * 共通モジュールの心臓部。君斗りんくのすれ違ひ通信 / 動員ちゃれんじ 双方から利用する。
 */

export type EventStatus = "upcoming" | "live" | "ended" | "canceled";
export type LocationType = "online" | "offline";
export type Visibility = "public" | "unlisted";

/** 既知の種別タグ。UI のサジェスト用。値自体は自由に増やせる（保存は文字列）。 */
export const KNOWN_TYPE_TAGS = [
  "haishin", // 配信
  "totsumachi", // 凸待ち
  "offkai", // オフ会
  "sagyo", // 作業通話
  "utawaku", // 歌枠
  "other",
] as const;

/** typeTags のカンマ区切り文字列 ⇔ 配列 変換 */
export function parseTypeTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function serializeTypeTags(tags: string[]): string {
  // 重複除去 + 空除去。順序は維持。
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags.map((x) => x.trim()).filter(Boolean)) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.join(",");
}

/**
 * 時刻から「あるべき表示上の状態」を導出する。
 *
 * 重要: 本人が明示的に live 表明（liveCheckinAt あり）した場合は、終了時刻を過ぎるまで
 * live を維持する（配信が予定より延びても光り続ける）。canceled は常に優先。
 *
 * @param stored DB に保存されている status（canceled の検出に使う）
 * @param now 現在時刻
 */
export function deriveStatus(
  params: {
    storedStatus: EventStatus;
    startAt: Date;
    endAt: Date | null;
    liveCheckinAt: Date | null;
  },
  now: Date
): EventStatus {
  const { storedStatus, startAt, endAt, liveCheckinAt } = params;

  // キャンセルは確定状態。時刻に関わらず覆らない。
  if (storedStatus === "canceled") return "canceled";

  // 終了時刻を過ぎていれば ended。
  if (endAt && now.getTime() >= endAt.getTime()) return "ended";

  // 本人が live 表明済みなら、終了時刻前は live。
  if (liveCheckinAt) return "live";

  // 開始時刻を過ぎていて endAt 未設定 or まだ → 本人表明がなければ upcoming のまま。
  // （自動で live にはしない。「今ここにいるよ」は本人の意思表示が必須という設計）
  if (now.getTime() < startAt.getTime()) return "upcoming";

  // 開始時刻は過ぎたが本人表明なし: まだ upcoming 扱い（表明待ち）。
  // endAt も無いので ended にもしない。
  return "upcoming";
}

/** 在席マップに「ライブ中」として出すべきか。 */
export function isLiveNow(
  params: {
    storedStatus: EventStatus;
    startAt: Date;
    endAt: Date | null;
    liveCheckinAt: Date | null;
  },
  now: Date
): boolean {
  return deriveStatus(params, now) === "live";
}

/** カレンダー（未来の予定）に出すべきか。 */
export function isUpcoming(
  params: {
    storedStatus: EventStatus;
    startAt: Date;
    endAt: Date | null;
    liveCheckinAt: Date | null;
  },
  now: Date
): boolean {
  return deriveStatus(params, now) === "upcoming";
}
