/**
 * lib/events/event-invite.ts
 *
 * 集まりに友達を誘うための文面とリンク。
 *
 * ★なぜ作ったか（2026-08-15 ユーザー要望「イベントには友達を誘う機能もいれてほしい」）:
 *   既存の「𝕏でシェア」(events-event-card.tsx:87) は**文面だけでURLが無く**、
 *   見た人がアプリへ来る導線が無かった。誘われた側が辿り着けなければ「誘う」に
 *   ならないので、必ず来られるリンクを添える。
 *
 * ★リンク先を /(tabs)/events にする理由:
 *   イベント個別の公開ページ（/event/[id] 等）はこのアプリに**存在しない**
 *   （ルート定数だけが旧テンプレートの名残で残っていて、実画面は無い）。
 *   無い画面へのURLを配ると誘われた人が not-found に落ちるので、
 *   実在する一覧タブへ送る。将来 個別ページを作ったらここだけ差し替えればよい。
 *
 * ★DM は作らない: アプリ内DMを持たない方針（CLAUDE.md 設計原則4「DM禁止、
 *   交流はXに委譲」）。誘う手段も既存のSNS/コピーに委譲する。
 */
import { Share, Platform } from "react-native";
import { APP_ORIGIN } from "@/lib/site-urls";

export type EventInviteInput = {
  title: string;
  startAt: Date | string;
  /** オンラインなら "online" */
  locationType?: string | null;
  prefecture?: string | null;
  venueName?: string | null;
  /**
   * 誘っている人の表示名。
   * doin-challenge.com の招待画面（app/invite/[id].tsx）が
   * 「〇〇さんから招待が届きました」の形にしていたのを採用した。
   * 誘いは人から来るものなので、差出人が見えると受け取り方が変わる。
   */
  inviterName?: string | null;
};

/** 集まり一覧（誘われた人の着地先）。個別ページが無いのでタブへ送る */
export function eventInviteUrl(origin: string = APP_ORIGIN): string {
  return `${origin}/events`;
}

/** 「8/16 19:00」のような表示。Invalid Date でも文面を壊さない */
function formatWhen(startAt: Date | string): string | null {
  const d = typeof startAt === "string" ? new Date(startAt) : startAt;
  if (Number.isNaN(d.getTime())) return null;

  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}〜`;
}

function formatWhere(input: EventInviteInput): string {
  if (input.locationType === "online") return "オンライン";
  const parts = [input.prefecture, input.venueName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "場所未定";
}

/**
 * 誘い文の本文（URLは含めない）。
 * X/Threads は text と url を別パラメータで渡すため分けておく。
 */
export function buildEventInviteText(input: EventInviteInput): string {
  const when = formatWhen(input.startAt);
  const where = formatWhere(input);
  const inviter = input.inviterName?.trim();

  const lines = [
    // 差出人が分かるなら先頭に置く（誰からの誘いかで受け取り方が変わる）
    inviter ? `${inviter}さんから集まりのお誘いです` : "【集まり】",
    input.title,
    when ? `${when} ${where}` : where,
    "いっしょにどうですか？",
  ];
  return lines.join("\n");
}

/** コピー用・メッセージアプリ用の全文（本文 + URL） */
export function buildEventInviteMessage(
  input: EventInviteInput,
  origin: string = APP_ORIGIN,
): string {
  return `${buildEventInviteText(input)}\n${eventInviteUrl(origin)}`;
}

/** 誘い文に付けるハッシュタグ */
export const EVENT_INVITE_HASHTAGS = ["君斗りんくのすれ違ひ通信"];

/**
 * OS の共有シートで誘う（LINE・メール・メッセージなど任意のアプリへ1タップ）。
 *
 * doin-challenge.com の招待画面（app/invite/[id].tsx:138 handleShare）から
 * 採用した導線。X/Threads だけだと「LINEで送りたい」に応えられない。
 *
 * ★Web では Share API が無いブラウザが多いので、その場合は false を返して
 *   呼び出し側にコピーへフォールバックさせる（無言で失敗しない）。
 */
export async function shareEventInvite(
  input: EventInviteInput,
  origin: string = APP_ORIGIN,
): Promise<boolean> {
  const message = buildEventInviteMessage(input, origin);
  try {
    const result = await Share.share({
      message,
      // iOS は url を分けて渡すとリンクとして扱われる
      ...(Platform.OS === "ios" ? { url: eventInviteUrl(origin) } : {}),
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
