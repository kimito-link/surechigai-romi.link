/**
 * 外部リンク用ナビゲーションユーティリティ
 * 
 * 外部URLへの遷移を一元管理し、セキュリティを強化します。
 * - URLホワイトリスト検証
 * - 相対パス禁止
 * - ログ出力
 */

import { Linking, Platform } from "react-native";

// 許可された外部ドメインのホワイトリスト
const ALLOWED_EXTERNAL_DOMAINS = [
  // SNS
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  // ★Threads（2026-08-21 追加）。
  //   lib/share.ts の buildThreadsIntentUrl は
  //   `https://www.threads.com/intent/post?...` を組み立てるのに、
  //   このリストに threads が**一度も入っていなかった**。
  //   openExternalUrl は許可外ドメインで**無言で false** を返すため、
  //   Threads の共有ボタンは押しても何も起きない状態だった（実測で発覚）。
  //   threads.net は threads.com へ移行済みだが、
  //   古いリンクが残っている可能性があるので両方許可する。
  "threads.com",
  "threads.net",
  // 配信プラットフォーム
  "twitcasting.tv",
  "showroom-live.com",
  "17.live",
  "mixch.tv",
  // チケット販売サイト
  "eplus.jp",
  "pia.jp",
  "l-tike.com",
  "ticket.co.jp",
  "ticketcamp.net",
  "tiget.net",
  // アプリストア（共有リンクからのDL導線で使う。
  // ここに無いと openExternalUrl が無言で false を返し、
  // ボタンを押しても何も起きない状態になる）
  "apps.apple.com",
  "play.google.com",
  // 公的機関のライブカメラ（足あとの場所の「いまの様子」を見に行く導線）。
  // 画像APIは有償なので取り込まず、公式の一覧ページへリンクするだけ。
  // ここに無いと openExternalUrl が無言で false を返し、押しても何も起きない。
  "mlit.go.jp",
  // その他
  "line.me",
  // lin.ee は LINE 公式アカウントの短縮URL（友だち追加の流入経路つき）。
  // line.me とは別ドメインなので、こちらも明示しないと弾かれる。
  "lin.ee",
  "discord.gg",
  "discord.com",
] as const;

/**
 * URLが許可されたドメインかどうかを検証
 */
function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // httpsのみ許可（httpは許可しない）
    if (parsed.protocol !== "https:") {
      console.warn(`[Navigation] Blocked non-HTTPS URL: ${url}`);
      return false;
    }
    
    // 相対パス禁止（hostnameが必須）
    if (!parsed.hostname) {
      console.warn(`[Navigation] Blocked URL without hostname: ${url}`);
      return false;
    }
    
    // ホワイトリストチェック
    const isAllowed = ALLOWED_EXTERNAL_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname === `www.${domain}` ||
        parsed.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      console.warn(`[Navigation] Blocked non-whitelisted domain: ${parsed.hostname}`);
    }
    
    return isAllowed;
  } catch (error) {
    console.error(`[Navigation] Invalid URL: ${url}`, error);
    return false;
  }
}

/**
 * 外部リンクを開く
 * 
 * @param url 開くURL（httpsのみ、ホワイトリストドメインのみ）
 * @returns 成功したかどうか
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  if (!isAllowedExternalUrl(url)) {
    return false;
  }

  try {
    if (Platform.OS === "web") {
      // Web環境ではwindow.openを使用
      window.open(url, "_blank", "noopener,noreferrer");
      console.log(`[Navigation] Opened external URL (web): ${url}`);
      return true;
    }

    // ネイティブ環境ではLinking.openURLを使用
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      console.log(`[Navigation] Opened external URL (native): ${url}`);
      return true;
    }

    console.warn(`[Navigation] Cannot open URL: ${url}`);
    return false;
  } catch (error) {
    console.error(`[Navigation] Failed to open external URL: ${url}`, error);
    return false;
  }
}

// ========================================
// Twitter専用ヘルパー関数
// ========================================

/**
 * Twitterプロフィールを開く
 * 
 * @param username Twitterユーザー名（@付きでも可）
 */
export function openTwitterProfile(username: string): Promise<boolean> {
  const cleanUsername = username.replace(/^@/, "");
  return openExternalUrl(`https://twitter.com/${cleanUsername}`);
}

/**
 * TwitterのDM画面を開く
 * 
 * @param username Twitterユーザー名（@付きでも可）
 */
export function openTwitterDM(username: string): Promise<boolean> {
  const cleanUsername = username.replace(/^@/, "");
  return openExternalUrl(
    `https://twitter.com/messages/compose?recipient_id=${cleanUsername}`
  );
}

/**
 * Twitterシェア画面を開く
 * 
 * @param text シェアするテキスト
 * @param url シェアするURL（オプション）
 */
export function openTwitterShare(text: string, url?: string): Promise<boolean> {
  const params = new URLSearchParams({ text });
  if (url) {
    params.set("url", url);
  }
  return openExternalUrl(`https://twitter.com/intent/tweet?${params.toString()}`);
}

// ========================================
// その他のSNS用ヘルパー関数
// ========================================

/**
 * YouTubeの動画を開く
 * 
 * @param videoId YouTube動画ID
 */
export function openYouTubeVideo(videoId: string): Promise<boolean> {
  return openExternalUrl(`https://www.youtube.com/watch?v=${videoId}`);
}

/**
 * YouTubeチャンネルを開く
 * 
 * @param channelId YouTubeチャンネルID
 */
export function openYouTubeChannel(channelId: string): Promise<boolean> {
  return openExternalUrl(`https://www.youtube.com/channel/${channelId}`);
}

/**
 * ツイキャスのライブを開く
 * 
 * @param username ツイキャスユーザー名
 */
export function openTwitcastingLive(username: string): Promise<boolean> {
  return openExternalUrl(`https://twitcasting.tv/${username}`);
}

/**
 * SHOWROOMのルームを開く
 * 
 * @param roomUrlKey SHOWROOMのルームURLキー
 */
export function openShowroomRoom(roomUrlKey: string): Promise<boolean> {
  return openExternalUrl(`https://www.showroom-live.com/${roomUrlKey}`);
}

// ========================================
// チケット販売サイト用ヘルパー関数
// ========================================

/**
 * チケット販売サイトを開く（汎用）
 * 
 * @param ticketUrl チケット販売ページのURL
 */
export function openTicketSite(ticketUrl: string): Promise<boolean> {
  return openExternalUrl(ticketUrl);
}

// ========================================
// ユーティリティ
// ========================================

/**
 * ホワイトリストにドメインを追加（開発用）
 * 本番環境では使用しないでください
 */
export function addAllowedDomain(domain: string): void {
  if (process.env.NODE_ENV === "development") {
    (ALLOWED_EXTERNAL_DOMAINS as unknown as string[]).push(domain);
    console.log(`[Navigation] Added domain to whitelist: ${domain}`);
  } else {
    console.warn("[Navigation] Cannot add domain in production");
  }
}

/**
 * 許可されたドメインの一覧を取得
 */
export function getAllowedDomains(): readonly string[] {
  return ALLOWED_EXTERNAL_DOMAINS;
}
