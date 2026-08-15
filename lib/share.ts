/**
 * シェア機能（Web Intent）
 * 君斗りんくのすれ違ひ通信: OGP画像付きX(Twitter)シェア
 */
import { Platform, Share, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { setStringAsync } from "expo-clipboard";
import { APP_ORIGIN } from "@/lib/site-urls";
import { renderShareWaitingScreen } from "@/lib/share-waiting-screen";

const APP_HASHTAG = "#君斗りんくのすれ違ひ通信";

export type PreparedSharePopup = {
  popup: Window | null;
};

/**
 * 共有リンクの発行を待つ上限。超えたら空タブを閉じてエラーを出す。
 *
 * これが無いと、リンク発行が「失敗」ではなく「遅い／返ってこない」だけのとき
 * catch に落ちず、開いた about:blank タブが永久に残る（2026-08-04 実機report）。
 */
export const SHARE_SLUG_TIMEOUT_MS = 8000;

export class ShareTimeoutError extends Error {
  constructor() {
    super("share slug timeout");
    this.name = "ShareTimeoutError";
  }
}

/** 共有リンク発行など「ユーザーが空タブを見ながら待つ処理」に上限を課す */
export async function withShareTimeout<T>(
  work: Promise<T>,
  timeoutMs = SHARE_SLUG_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ShareTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

/**
 * 名前付きタブで開く。連続シェアで about:blank タブが増殖しないよう、
 * 前回の準備タブが生きていれば同じタブを再利用する。
 */
const SHARE_POPUP_NAME = "surechigai-share";

export function prepareSharePopup(): PreparedSharePopup | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;

  const popup = window.open("about:blank", SHARE_POPUP_NAME);
  if (popup) {
    try {
      // ここで opener を切ってはいけない。切ると後段の location.href 差し替えが
      // できなくなり、空タブが about:blank のまま残る。実際の遮断は遷移直前に行う。
      //
      // 素のテキストだと実質白画面に見えるので、りんくの待機画面を描画する
      // (リンク発行は最大 SHARE_SLUG_TIMEOUT_MS = 8秒待つため、その間ずっと白いと
      //  「壊れた」と受け取られる)。外部リソース非依存の理由は share-waiting-screen.ts 参照。
      renderShareWaitingScreen(popup);
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

/**
 * Threads の Web Intent。X の intent/tweet と同じ思想で、公式にドキュメント化されている。
 * https://developers.facebook.com/docs/threads/threads-web-intents/
 *
 * X との違い:
 *   - アプリ登録・App ID・OAuth はいずれも不要（X の intent と同じ）
 *   - ハッシュタグは `hashtags` ではなく `tag`（**1つだけ**。50文字以内、
 *     改行・タブ・ピリオド・アンパサンドは不可）。複数タグは渡せないので本文に含める
 *   - モバイルでは Threads アプリがインストール済みなら公式にアプリが開く
 *   - ドメインは threads.com（threads.net から移行済み）
 */
function buildThreadsIntentUrl(text: string, url?: string, hashtags?: string[]): string {
  const params = new URLSearchParams();
  params.set("text", text);
  if (url) params.set("url", url);
  // tag は1つだけ。仕様上使えない文字を含むものは落とす（付けられなくても投稿は成立する）。
  const tag = hashtags?.find((h) => h && !/[\n\t.&]/.test(h));
  if (tag) params.set("tag", tag);
  return `https://www.threads.com/intent/post?${params.toString()}`;
}

/**
 * 新しいタブで開く。開けなければ false（現在のタブは奪わない）。
 *
 * 現在タブを X に差し替える挙動は、ユーザーがアプリの画面（チェックイン結果など）を
 * 失うので最後の手段にもしない。開けなかったことを呼び出し側に伝えて案内を出す。
 */
function openInNewTab(url: string): boolean {
  const opened = window.open(url, "_blank");
  if (!opened) return false;
  try {
    opened.opener = null;
  } catch {
    // noop
  }
  return true;
}

function openWebShareUrl(
  twitterUrl: string,
  target?: PreparedSharePopup | null,
): boolean {
  if (typeof window === "undefined") return false;

  if (target) {
    if (target.popup && !target.popup.closed) {
      target.popup.location.href = twitterUrl;
      try {
        // 遷移させたあとに遮断する（準備中は差し替えのため参照を保持しておく必要がある）
        target.popup.opener = null;
      } catch {
        // noop
      }
      return true;
    }
    // 空タブを確保できなかった（ポップアップブロック）、または準備中にユーザーが
    // そのタブを閉じた場合。ここで window.location.assign してはいけない(2026-08-04)。
    // 現在のタブごと X に飛ぶとアプリの画面が失われ、しかも true を返すので
    // 呼び出し側の「ポップアップ許可を確認してください」も出ない。
    // iOS Safari はポップアップブロックが既定 ON なので日常的に踏まれる。
    // 開き直しを一度だけ試し、それも塞がれていれば素直に失敗を返す。
    return openInNewTab(twitterUrl);
  }

  return openInNewTab(twitterUrl);
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

/**
 * Threads の Web Intent でシェア。
 *
 * なぜ Threads を足したか:
 *   実地で人に聞いたところ「Instagram と Threads しかやっていない」層が相当数いた。
 *   X だけでは届かない。Threads は X と同じく**アプリ登録も認証も不要**の
 *   公式 Web Intent があるので、実質ゼロコストで届く範囲を広げられる。
 *
 * Instagram を足さない（足せない）理由:
 *   Instagram には intent 相当が存在せず、Meta が意図的に塞いでいる。
 *   フィード投稿のキャプション事前入力は公式に提供されておらず、Stories 共有は
 *   ネイティブアプリ限定（Web 不可）＋ Facebook App ID 必須 ＋ 9:16 画像の別途生成が必要で、
 *   しかも**本文にリンクを埋められない**（このアプリは OGP 付き URL を配る設計なので噛み合わない）。
 *   Graph API は個人アカウント非対応（ビジネス/クリエイター必須・審査2〜4週間）。
 *   Buffer ですら個人 Instagram には自動投稿できず「通知して手動完了」方式にしている。
 *   → Instagram は将来 Web Share API（OS のシェアシート）経由で拾う方が筋が良い。
 */
export async function shareToThreads(
  text: string,
  url?: string,
  hashtags?: string[],
  options?: { popup?: PreparedSharePopup | null },
): Promise<boolean> {
  try {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const threadsUrl = buildThreadsIntentUrl(text, url, hashtags);

    if (Platform.OS === "web") {
      return openWebShareUrl(threadsUrl, options?.popup);
    }

    // ネイティブでは Threads アプリがインストール済みならアプリが開く（公式仕様）。
    await Linking.openURL(threadsUrl);
    return true;
  } catch (error) {
    console.error("[Share] Error sharing to Threads:", error);
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

/** 共有先。既定は X（既存の導線を変えないため）。 */
export type ShareTarget = "x" | "threads";

/**
 * 自分の現在地（最後の記録地点）をシェア。
 * shareUrl は /u/<shareSlug>。共有先のカードに地図サムネ（OGP）が表示される。
 *
 * target で X / Threads を選べる。文面とURLは共通なので、
 * どちらで共有しても同じ OGP カードが出る。
 */
export async function shareMyLocation(
  shareUrl: string,
  areaLabel?: string,
  options?: { popup?: PreparedSharePopup | null; target?: ShareTarget },
): Promise<boolean> {
  const { text, hashtags } = buildMyLocationShareText(areaLabel);
  const share = options?.target === "threads" ? shareToThreads : shareToTwitter;
  return share(text, shareUrl, hashtags, { popup: options?.popup });
}

/**
 * 共有の本文とハッシュタグ。X / Threads / Instagram 用コピーで共通に使う
 * （文言を変えるときに1箇所で済むようにする）。
 */
export function buildMyLocationShareText(areaLabel?: string): {
  text: string;
  hashtags: string[];
} {
  const where = areaLabel ? `${areaLabel}にいるよ。` : "";
  return {
    text: `${where}会いたい君がいる現在地。`,
    hashtags: ["君斗りんくのすれ違ひ通信"],
  };
}

/**
 * Instagram 用に共有リンクをクリップボードへコピーする。
 *
 * ★X/Threads と同じ「ワンタップで投稿画面」は Instagram では作れない:
 *   Web Intent が存在せず、フィード投稿の本文に貼ったURLはリンクにならない
 *   （プロフィール欄かストーリーズでしか機能しない）。Graph API での投稿も
 *   個人アカウントには開放されていない。
 *   よってユーザーの指示どおり「アドレスを貼る程度」に留め、手貼りしてもらう。
 */
export async function copyShareLinkForInstagram(
  shareUrl: string,
  areaLabel?: string,
): Promise<boolean> {
  const { text } = buildMyLocationShareText(areaLabel);
  const body = `${text}\n${shareUrl}`;

  try {
    // 静的 import にする: 動的 import は Hermes の Release ビルドでだけ落ちた
    // 前科がある（exifr の件）。tsc もテストも Web ビルドも通過してしまう類の事故。
    await setStringAsync(body);
    return true;
  } catch {
    return false;
  }
}
