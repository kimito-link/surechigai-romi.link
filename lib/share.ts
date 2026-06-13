/**
 * シェア機能
 * v6.31: バイラル効果向上版
 */
import { Platform, Share, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { createEventSlug, createProfileSlug } from "@/lib/slug";

const APP_HASHTAG = "#動員ちゃれんじ";

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
    if (hostname.includes("doin-challenge.com")) {
      return "https://doin-challenge.com";
    }
  }
  // デフォルトは本番URL
  return "https://doin-challenge.com";
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
 * Twitterでシェア
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
    const canOpen = await Linking.canOpenURL(twitterUrl);
    if (canOpen) {
      await Linking.openURL(twitterUrl);
      return true;
    } else {
      // canOpenURLがfalseでも試みる
      await Linking.openURL(twitterUrl);
      return true;
    }
  } catch (error) {
    console.error("[Share] Error sharing to Twitter:", error);
    return false;
  }
}

/**
 * チャレンジ参加表明をシェア
 * v6.31: バイラル効果向上 - 短く、明確なCTA、社会的証明
 */
export async function shareParticipation(
  challengeTitle: string,
  hostName: string,
  challengeId: number,
  currentParticipants?: number
): Promise<boolean> {
  // 参加者数があれば社会的証明を追加
  const socialProof = currentParticipants && currentParticipants > 10
    ? `\n\n${currentParticipants}人が参加中！`
    : "";
  
  // 短く、明確なCTAを含むテキスト
  const text = `🎉 ${hostName}の「${challengeTitle}」に参加！${socialProof}\n\n一緒に応援しよう👇`;
  // 新しい共有URL形式を使用
  const slug = createEventSlug(challengeId, challengeTitle);
  const url = `${getAppUrl()}/e/${slug}`;

  // ハッシュタグは2-3個が最適
  const hashtags = ["動員ちゃれんじ"];
  // ホスト名をハッシュタグ化（スペースを除去）
  const hostTag = hostName.replace(/[\s　]/g, "");
  if (hostTag && hostTag.length <= 20) {
    hashtags.push(hostTag);
  }

  return shareToTwitter(text, url, hashtags);
}

/**
 * チャレンジ達成をシェア
 * v6.31: 達成感と緊急性を強調
 */
export async function shareChallengeGoalReached(
  challengeTitle: string,
  hostName: string,
  goalValue: number,
  unit: string,
  challengeId: number
): Promise<boolean> {
  const text = `🎊 目標${goalValue}${unit}達成！\n\n「${challengeTitle}」\nみんなの応援で達成できました！\n\n次の目標も一緒に👇`;
  // 新しい共有URL形式を使用
  const slug = createEventSlug(challengeId, challengeTitle);
  const url = `${getAppUrl()}/e/${slug}`;

  return shareToTwitter(text, url, ["動員ちゃれんじ", "目標達成"]);
}

/**
 * マイルストーン達成をシェア
 * v6.31: 緊急性と進捗を強調
 */
export async function shareMilestoneReached(
  challengeTitle: string,
  milestone: number,
  currentValue: number,
  unit: string,
  challengeId: number,
  goalValue?: number
): Promise<boolean> {
  const remaining = goalValue ? goalValue - currentValue : null;
  const urgency = remaining && remaining > 0
    ? `\nあと${remaining}${unit}で目標達成！`
    : "";
  
  const text = `🏆 ${milestone}%達成！\n\n「${challengeTitle}」が${currentValue}${unit}に到達${urgency}\n\n一緒に達成しよう👇`;
  // 新しい共有URL形式を使用
  const slug = createEventSlug(challengeId, challengeTitle);
  const url = `${getAppUrl()}/e/${slug}`;

  return shareToTwitter(text, url, ["動員ちゃれんじ"]);
}

/**
 * チャレンジ作成をシェア
 * v6.31: 明確なCTAと参加しやすさを強調
 */
export async function shareChallengeCreated(
  challengeTitle: string,
  goalValue: number,
  unit: string,
  challengeId: number
): Promise<boolean> {
  const text = `📢 チャレンジ開始！\n\n「${challengeTitle}」\n目標: ${goalValue}${unit}\n\n参加は1タップ👇`;
  // 新しい共有URL形式を使用
  const slug = createEventSlug(challengeId, challengeTitle);
  const url = `${getAppUrl()}/e/${slug}`;

  return shareToTwitter(text, url, ["動員ちゃれんじ"]);
}

/**
 * アプリをシェア
 */
export async function shareApp(): Promise<boolean> {
  const text = `🎵 推しの応援をもっと楽しく！\n\n「動員ちゃれんじ」でライブやイベントの動員目標をみんなで達成しよう！`;

  return shareToTwitter(text, getAppUrl(), ["動員ちゃれんじ"]);
}

/**
 * カスタムメッセージでシェア
 */
export async function shareCustomMessage(
  message: string,
  challengeId?: number,
  challengeTitle?: string
): Promise<boolean> {
  // 新しい共有URL形式を使用
  const url = challengeId 
    ? `${getAppUrl()}/e/${createEventSlug(challengeId, challengeTitle)}` 
    : getAppUrl();

  return shareToTwitter(message, url, ["動員ちゃれんじ"]);
}
