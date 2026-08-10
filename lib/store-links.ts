/**
 * アプリストアへのDL導線で使うURLを解決する。
 *
 * SSOT は app.config.json の stores。ここにIDを書き足せば導線が出る。
 * URLを画面側にハードコードしない（採番後の差し替え漏れが起きるため）。
 *
 * 重要: まだ配信していないストアのリンクは出さない。
 * 押しても「ページが見つかりません」になる導線は、無いより悪い。
 * - iOS:     ascAppId があれば出す（審査通過前でもURL自体は確定している）
 * - Android: playAppId が空の間は出さない（Play Console 未登録）
 */
import { Platform } from "react-native";
import appConfig from "@/app.config.json";

const stores = appConfig.stores as {
  ascAppId?: string;
  playAppId?: string;
  playPackageName?: string;
};

export type StoreKind = "ios" | "android";

export type StoreLink = {
  kind: StoreKind;
  label: string;
  url: string;
};

/** App Store の作品ページ。ascAppId は審査前から確定している */
export function iosStoreUrl(): string | null {
  const id = (stores.ascAppId || "").trim();
  if (!id) return null;
  return `https://apps.apple.com/jp/app/id${id}`;
}

/**
 * Google Play の作品ページ。
 * Play は packageName でURLが決まるが、ストア登録が済んでいない間は
 * 404 になるので playAppId（登録済みの印）が入るまで出さない。
 */
export function androidStoreUrl(): string | null {
  const registered = (stores.playAppId || "").trim();
  if (!registered) return null;
  const pkg = (stores.playPackageName || "").trim();
  if (!pkg) return null;
  return `https://play.google.com/store/apps/details?id=${pkg}`;
}

/** 配信中のストアだけを返す。1つも無ければ空配列 */
export function availableStoreLinks(): StoreLink[] {
  const links: StoreLink[] = [];
  const ios = iosStoreUrl();
  if (ios) links.push({ kind: "ios", label: "App Store", url: ios });
  const android = androidStoreUrl();
  if (android) links.push({ kind: "android", label: "Google Play", url: android });
  return links;
}

/**
 * 閲覧環境に合う1件を優先して返す。
 * iPhone で見ている人に Google Play を出しても意味がないため、
 * UA から推定できる場合はそちらを先頭にする。
 */
export function preferredStoreLink(): StoreLink | null {
  const links = availableStoreLinks();
  if (links.length === 0) return null;

  const kind = guessViewerPlatform();
  if (kind) {
    const match = links.find((l) => l.kind === kind);
    if (match) return match;
  }
  return links[0];
}

/**
 * 閲覧者の環境を推定する。
 * ネイティブアプリ内なら Platform.OS が確実。
 * Web は UA から推定するが、外れても「両方出す」に落ちるだけで壊れない。
 */
export function guessViewerPlatform(): StoreKind | null {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  if (Platform.OS !== "web") return null;
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

/**
 * すでにネイティブアプリの中で見ているか。
 * アプリ内で「アプリをダウンロード」を出すのは無意味なので、
 * 導線の表示可否の判定に使う。
 */
export function isInsideNativeApp(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}
