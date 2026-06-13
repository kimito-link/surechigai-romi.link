/**
 * シェア機能（Web Intent）
 * すれちがいロミ: OGP画像付きX(Twitter)シェア
 */
import { Platform, Share, Linking } from "react-native";
import * as Haptics from "expo-haptics";

const APP_HASHTAG = "#すれちがいロミ";

// 本番URLを取得（環境変数から、またはデフォルト値）
function getAppUrl(): string {
  // Web環境では現在のURLから取得
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    // 開発環境の場合はそのまま使用
    if (hostname.includes("manus.computer") || hostname.includes("localhost")) {
      return `${protocol}//${hostname}${port ? ":" + port : ""}`;
    }
    // 本番環境
    if (hostname.includes("surechigai-romi.link")) {
      return "https://surechigai-romi.link";
    }
  }
  // デフォルトは本番URL
  return "https://surechigai-romi.link";
}

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  hashtags?: string[];
}

/**
 * 汎用シェア機能
 */
export async function shareContent(content: ShareContent): Promise<boolean> {
  try {
    // ハプティックフィードバック
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const shareMessage = content.url
      ? `${content.message}\n\n${content.url}`
      : content.message;

    const result = await Share.share({
      title: content.title,
      message: shareMessage,
    });

    if (result.action === Share.sharedAction) {
      console.log("[Share] Content shared successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Share] Error sharing content:", error);
    return false;
  }
}

/**
 * X (Twitter) Web Intent でシェア
 */
export async function shareToTwitter(
  text: string,
  url?: string,
  hashtags?: string[]
): Promise<boolean> {
  try {
    // ハプティックフィードバック
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const hashtagString = hashtags?.join(",") || "";
    const params = new URLSearchParams();
    params.set("text", text);
    if (url) params.set("url", url);
    if (hashtagString) params.set("hashtags", hashtagString);

    const twitterUrl = `https://twitter.com/intent/tweet?${params.toString()}`;

    // Web環境ではwindow.openを使用
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.open(twitterUrl, "_blank", "noopener,noreferrer");
        return true;
      }
      return false;
    }

    // ネイティブ環境ではLinking.openURLを使用
    await Linking.openURL(twitterUrl);
    return true;
  } catch (error) {
    console.error("[Share] Error sharing to Twitter:", error);
    return false;
  }
}

/**
 * すれ違い体験をシェア（市区町村粒度OGP付き）
 */
export async function shareEncounter(
  areaName: string,
  encounterId: string
): Promise<boolean> {
  const text = `${areaName}ですれ違いました！ ${APP_HASHTAG}`;
  const url = `${getAppUrl()}/encounters/${encounterId}`;
  return shareToTwitter(text, url, ["すれちがいロミ"]);
}

/**
 * アプリをシェア
 */
export async function shareApp(): Promise<boolean> {
  const text = `すれ違い通信アプリ「すれちがいロミ」で、あなたのすれ違い体験を記録しよう！ ${APP_HASHTAG}`;
  return shareToTwitter(text, getAppUrl(), ["すれちがいロミ"]);
}
