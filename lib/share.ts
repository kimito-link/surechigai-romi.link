/**
 * シェア機能（Web Intent）
 * 君斗りんくのすれ違ひ通信: OGP画像付きX(Twitter)シェア
 */
import { Platform, Share, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { APP_ORIGIN } from "@/lib/site-urls";

const APP_HASHTAG = "#君斗りんくのすれ違ひ通信";

export type PreparedSharePopup = {
  popup: Window | null;
};

// 本番URLを取得（環境変数から、またはデフォルト値）
function getAppUrl(): string {
  // Web環境では現在のURLから取得
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    // 開発環境の場合はそのまま使用
    if (
      hostname.includes("manus.computer") ||
      hostname.includes("localhost") ||
      hostname === "127.0.0.1"
    ) {
      return `${protocol}//${hostname}${port ? ":" + port : ""}`;
    }
  }
  // 本番共有URLは旧ドメインからのアクセス時も正規ドメインに統一する。
  return APP_ORIGIN;
}

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  hashtags?: string[];
}

export function prepareSharePopup(): PreparedSharePopup | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;

  const popup = window.open("about:blank", "_blank");
  if (popup) {
    try {
      popup.opener = null;
      popup.document.title = "Xでシェア";
      popup.document.body.textContent = "共有画面を準備しています…";
    } catch {
      // about:blank の初期化に失敗しても、URL差し替え自体は続行できる。
    }
  }
  return { popup };
}

export function closePreparedSharePopup(target: PreparedSharePopup | null | undefined): void {
  try {
    if (target?.popup && !target.popup.closed) {
      target.popup.close();
    }
  } catch {
    // すでに閉じられた、またはブラウザが close を拒否した場合は何もしない。
  }
}

function buildTwitterIntentUrl(text: string, url?: string, hashtags?: string[]): string {
  const hashtagString = hashtags?.join(",") || "";
  const params = new URLSearchParams();
  params.set("text", text);
  if (url) params.set("url", url);
  if (hashtagString) params.set("hashtags", hashtagString);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function openWebShareUrl(
  twitterUrl: string,
  target?: PreparedSharePopup | null,
): boolean {
  if (typeof window === "undefined") return false;

  if (target) {
    if (target.popup && !target.popup.closed) {
      target.popup.location.href = twitterUrl;
      return true;
    }
    window.location.assign(twitterUrl);
    return true;
  }

  const popup = window.open(twitterUrl, "_blank");
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      // noop
    }
    return true;
  }

  window.location.assign(twitterUrl);
  return true;
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
  hashtags?: string[],
  options?: { popup?: PreparedSharePopup | null },
): Promise<boolean> {
  try {
    // ハプティックフィードバック
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const twitterUrl = buildTwitterIntentUrl(text, url, hashtags);

    // Web環境ではwindow.openを使用
    if (Platform.OS === "web") {
      return openWebShareUrl(twitterUrl, options?.popup);
    }

    // ネイティブ環境ではLinking.openURLを使用
    await Linking.openURL(twitterUrl);
    return true;
  } catch (error) {
    console.error("[Share] Error sharing to Twitter:", error);
    return false;
  }
}

/* shareEncounter は削除済み(P2-1): 呼び出しゼロのデッドコードで、
   生成URL /encounters/<id> に対応するルートも存在しなかった。
   すれ違い共有を作る際は /u/<slug> 系(shareMyLocation)の文法に合わせること。 */

/**
 * アプリをシェア
 */
export async function shareApp(): Promise<boolean> {
  const text = `すれ違い通信アプリ「君斗りんくのすれ違ひ通信」で、あなたのすれ違い体験を記録しよう！ ${APP_HASHTAG}`;
  return shareToTwitter(text, getAppUrl(), ["君斗りんくのすれ違ひ通信"]);
}

/**
 * 自分の現在地（最後の記録地点）を X でシェア。
 * shareUrl は /u/<shareSlug>。共有先のカードに地図サムネ（OGP）が表示される。
 */
export async function shareMyLocation(
  shareUrl: string,
  areaLabel?: string,
  options?: { popup?: PreparedSharePopup | null },
): Promise<boolean> {
  const where = areaLabel ? `${areaLabel}にいるよ。` : "";
  const text = `${where}会いたい君がいる現在地。`;
  return shareToTwitter(text, shareUrl, ["君斗りんくのすれ違ひ通信"], options);
}
