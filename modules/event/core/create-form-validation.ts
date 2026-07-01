/**
 * 集まり作成フォームのクライアント側バリデーション（event.create と整合）。
 */
import { isValidPrefecture } from "./prefectures.js";

export type EventCreateFormInput = {
  title: string;
  isOnline: boolean;
  onlineUrl: string;
  prefecture: string;
  isUnlisted: boolean;
  accessCode: string;
};

export function isValidEventOnlineUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEventCreateForm(input: EventCreateFormInput): string | null {
  if (!input.title.trim()) {
    return "タイトルを入れてください";
  }
  if (input.isOnline) {
    if (!input.onlineUrl.trim()) {
      return "オンライン開催は配信/通話URLが必要です";
    }
    if (!isValidEventOnlineUrl(input.onlineUrl)) {
      return "URLは https:// で始まる形式で入力してください";
    }
  } else if (!input.prefecture || !isValidPrefecture(input.prefecture)) {
    return "リアル開催は都道府県を選んでください";
  }
  if (input.isUnlisted && !input.accessCode.trim()) {
    return "限定にする場合は合言葉を決めてください";
  }
  return null;
}
