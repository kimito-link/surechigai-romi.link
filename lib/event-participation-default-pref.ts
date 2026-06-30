/**
 * 参加表明フォーム — 都道府県のデフォルト値（端末ローカル保存）。
 * 一度選べば、別の集まりでも初期値として出る。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "eventParticipation.defaultPrefecture";

export async function getDefaultParticipationPrefecture(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setDefaultParticipationPrefecture(prefecture: string): Promise<void> {
  const trimmed = prefecture.trim();
  if (!trimmed) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // 保存失敗時もフォーム操作は続行
  }
}

/** 参加表明モーダル用の都道府県初期値 */
export function resolveParticipationPrefecture(options: {
  minePrefecture?: string | null;
  savedDefault?: string | null;
  userPrefecture?: string | null;
  eventPrefecture?: string | null;
}): string {
  return (
    options.minePrefecture ??
    options.savedDefault ??
    options.userPrefecture ??
    options.eventPrefecture ??
    ""
  );
}
