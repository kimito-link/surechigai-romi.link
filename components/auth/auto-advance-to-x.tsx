import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { palette } from "@/theme/tokens";
import { isNativeAppShell } from "@/lib/native-app-shell";
import { shouldAutoAdvanceToX } from "@/lib/auto-advance-to-x-guard";
import { navigateReplace } from "@/lib/navigation";

/**
 * ★useAuth()を直接呼ばないこと（2026-09-30実損対応）。
 *   app/_layout.tsxのAuthProvider切り替え（placeholder→ClerkRootProvider等、
 *   ラッパーの型系譜が変わるたびstackツリー全体が強制的に再マウントされる既知の構造、
 *   _layout.tsx 117-126行目のコメント参照）の影響で、useAuth()に依存するこの
 *   コンポーネントがReact hydrationエラー(#418)を誘発することを実機ログで確認した。
 *   components/auth/auto-x-return-notice.tsxと同じ設計（window.Clerkを任意参照して
 *   Providerへの依存を断つ）を踏襲する。
 */
type ClerkGlobal = { loaded?: boolean; user?: unknown };

function readClerkAuthState(): { isAuthReady: boolean; hasUser: boolean } {
  if (typeof window === "undefined") return { isAuthReady: false, hasUser: false };
  const clerk = (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
  if (!clerk?.loaded) return { isAuthReady: false, hasUser: false };
  return { isAuthReady: true, hasUser: !!clerk.user };
}

const AUTO_PARAM = "auto";
const AUTO_VALUE = "x";
const COOLDOWN_KEY = "surechigai:auto-x-last-fired-at";
const COOLDOWN_MS = 3000;
const TIMEOUT_MS = 9000;
const POLL_MS = 120;

const LINK_CHARACTER = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

const X_BUTTON_SELECTOR = [
  ".cl-socialButtonsBlockButton__x",
  ".cl-socialButtonsIconButton__x",
  ".cl-socialButtonsBlockButton__twitter",
  ".cl-socialButtonsIconButton__twitter",
].join(", ");

function hasAutoXParam(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  // ネイティブアプリでは自動遷移しない（App Store Guideline 4.8・2026-08-05 の却下対応）。
  // Sign in with Apple は以前から実装済みだったが、この 1 タップ導線が X を自動クリックして
  // しまうため、審査員が Apple を選ぶ機会そのものが無く「Xしか無い」と判定された。
  // Web の 1 タップ UX は維持し、ネイティブだけプロバイダを明示的に選ばせる。
  if (isNativeAppShell()) return false;
  return (
    new URL(window.location.href).searchParams.get(AUTO_PARAM) === AUTO_VALUE
  );
}

function isSsoCallback(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return (
    window.location.hash.includes("sso-callback") ||
    window.location.pathname.includes("sso-callback")
  );
}

function isWithinCooldown(): boolean {
  try {
    const raw = sessionStorage.getItem(COOLDOWN_KEY);
    if (!raw) return false;
    const last = Number(raw);
    return Number.isFinite(last) && Date.now() - last < COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * click実行後にナビゲーションが起きない失敗モードの検知（2026-09-30実損発見）。
 * button.click()自体は成功するのに、実際にX認可画面へ遷移しないケースがあった
 * （原因未特定。satellite構成またはClerk側の内部処理起因の可能性）。
 * giveUp()（ボタン未発見時のタイムアウト）では検知できない別の失敗モードのため分離。
 */
function warnIfUrlUnchanged(urlBeforeClick: string): void {
  if (window.location.href !== urlBeforeClick) return;
  if (typeof console === "undefined" || !console.warn) return;
  console.warn(
    "[AutoAdvanceToX] Xボタンをclickしましたが、想定時間内にページ遷移が発生しませんでした。X認可フローが開始されていない可能性があります。",
  );
}

/**
 * ボタン未発見のままタイムアウトした場合の可視化（PR#48）。
 * Clerkの内部クラス名変更でCSSセレクタ・フォールバック両方が外れた場合の検知用。
 * ユーザー体験は変えず通常の選択モーダルへ戻すのみ（正本§4.1「壊れ方の上限を改善ゼロに固定」）。
 */
function warnButtonNotFound(): void {
  if (typeof console === "undefined" || !console.warn) return;
  console.warn(
    "[AutoAdvanceToX] Xボタンが見つからずタイムアウトしました。通常の選択モーダルのまま表示します。Clerkの内部クラス名が変わった可能性があります。",
  );
}

function markFiredNow(): void {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // sessionStorage が使えない環境でも、effect 内の didClick で多重発火は防ぐ。
  }
}

/**
 * ★2026-09-30実損対応: window.history.replaceStateを直接叩くと、Expo Routerの
 *   内部ルーティング状態(node_modules/expo-router/build/fork/useLinking.jsの
 *   onStateChange)と不整合になり、直後にReact Navigationの状態変化がトリガーされた
 *   瞬間、Expo Router自身が「記憶していた古いパス(auto=x付き)」でURLを上書きし
 *   直してしまうことを実機ログで確認した(スタックトレースでExpo Router内部の
 *   history.replace呼び出しであることまで特定済み)。
 *   navigateReplace.withUrl()(このリポ既存の集約ナビゲーションAPI、内部でexpo-routerの
 *   router.replace()を呼ぶ)を使えば、React Navigationのルート状態自体が更新される
 *   ため、この巻き戻りが起きない。
 */
function removeAutoXParam(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get(AUTO_PARAM) !== AUTO_VALUE) return;
  url.searchParams.delete(AUTO_PARAM);
  navigateReplace.withUrl(`${url.pathname}${url.search}${url.hash}`);
}

function resolveClickableTarget(candidate: HTMLElement): HTMLElement | null {
  const target =
    candidate.closest<HTMLElement>("button, a, [role='button']") ?? candidate;
  if (target.getAttribute("aria-disabled") === "true") return null;
  if (target instanceof HTMLButtonElement && target.disabled) return null;
  return target;
}

function findClickableXButton(): HTMLElement | null {
  // ★自分自身でガードする（2026-08-21）。
  //   実際の呼び出し元は Web でしか動かない経路なので今は安全だが、
  //   この関数だけを見ると `document` を無防備に触っている。
  //   Hermes には document が無く、うっかり別の場所から呼ぶと
  //   起動時に全画面エラー → App Store 却下（iOS 518 の実績）になる。
  //   呼び出し元の事情に安全を委ねない。
  if (typeof document === "undefined") return null;

  const matched = document.querySelector<HTMLElement>(X_BUTTON_SELECTOR);
  if (matched) return resolveClickableTarget(matched);

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("button, a, [role='button']"),
  );

  for (const candidate of candidates) {
    const target = resolveClickableTarget(candidate);
    if (!target) continue;
    const hay = (
      (target.getAttribute("data-provider") || "") +
      " " +
      (target.getAttribute("aria-label") || "") +
      " " +
      (target.getAttribute("data-localization-key") || "") +
      " " +
      (target.getAttribute("class") || "") +
      " " +
      (target.className || "") +
      " " +
      (target.textContent || "")
    ).toLowerCase();
    if (/twitter|\bx\b|__x\b|\boauth_x\b/.test(hay)) return target;
  }

  return null;
}

/**
 * kimito.link と同じ 1 タップ導線。Clerk 標準 SignIn を壊さず、X ボタンへ click を送る。
 *
 * ★2026-09-30実損対応: tryClick()内のbutton.click()はsetTimeout(fn, 0)で1タスク
 *   遅延させている。MutationObserver検知直後の同期clickだと、Clerkが<SignIn/>を描画した
 *   直後でイベントハンドラがまだ完全にアタッチされていない競合状態があり、click自体は
 *   実行されるのにX OAuthフローが開始されない現象を実機で確認した(同じbuttonを後から
 *   コンソールで単体click()すると常に成功する=button自体・Clerk自体は正常、タイミングの
 *   問題)。requestAnimationFrameは非表示/非フォーカスタブでコールバックが実行されない
 *   仕様があり検証環境で機能しなかったため不採用、setTimeoutを使う。
 */
export function AutoAdvanceToX() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const hasParam = hasAutoXParam();
    if (!hasParam) {
      setShowOverlay(false);
      return;
    }
    if (isSsoCallback()) {
      setShowOverlay(false);
      return;
    }
    setShowOverlay(true);
    if (isWithinCooldown()) {
      const t = window.setTimeout(() => setShowOverlay(false), 400);
      return () => window.clearTimeout(t);
    }
    let didClick = false;
    let observer: MutationObserver | null = null;
    const intervalId = window.setInterval(tryClick, POLL_MS);
    const timeoutId = window.setTimeout(giveUp, TIMEOUT_MS);
    function cleanupTimers() {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      observer?.disconnect();
      observer = null;
    }
    function giveUp() {
      cleanupTimers();
      setShowOverlay(false);
      warnButtonNotFound();
    }
    function tryClick() {
      if (didClick) return;
      const { isAuthReady, hasUser } = readClerkAuthState();
      if (isAuthReady && hasUser) {
        // ログイン済み再訪: 発火させず param だけ消して終了。
        didClick = true;
        removeAutoXParam();
        cleanupTimers();
        setShowOverlay(false);
        return;
      }
      if (!shouldAutoAdvanceToX({ hasParam: true, isSso: false, isAuthReady, hasUser })) return;
      const button = findClickableXButton();
      if (!button) return;
      didClick = true;
      markFiredNow();
      cleanupTimers();
      removeAutoXParam();
      const urlBeforeClick = window.location.href;
      // rAFは非表示タブで動かない(2026-09-30実機検証)。setTimeout(fn,0)で次タスクまで遅延。
      window.setTimeout(() => {
        console.warn("[DEBUG] pre-click", { connected: button.isConnected, disabled: (button as HTMLButtonElement).disabled, ariaDisabled: button.getAttribute("aria-disabled") });
        button.click();
        console.warn("[DEBUG] post-click", { connected: button.isConnected, href: window.location.href });
        window.setTimeout(() => warnIfUrlUnchanged(urlBeforeClick), 2000);
      }, 0);
    }
    observer = new MutationObserver(tryClick);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-disabled", "class", "disabled"],
      childList: true,
      subtree: true,
    });
    tryClick();

    return () => {
      didClick = true;
      cleanupTimers();
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <View
      accessibilityLiveRegion="assertive"
      style={{
        position:
          Platform.OS === "web" ? ("fixed" as const) : ("absolute" as const),
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483646,
        backgroundColor: palette.kimitoBlue,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <Image
        source={LINK_CHARACTER}
        style={{ width: 128, height: 128 }}
        contentFit="contain"
      />
      <View style={{ marginTop: 24, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: palette.white,
            textAlign: "center",
          }}
        >
          Xの画面へ進んでいます…
        </Text>
        <Text
          style={{
            marginTop: 12,
            fontSize: 16,
            fontWeight: "600",
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
          }}
        >
          このまま少しお待ちください。
        </Text>
      </View>
      <View
        style={{
          marginTop: 24,
          width: 160,
          height: 6,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.25)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: "50%",
            height: "100%",
            borderRadius: 999,
            backgroundColor: palette.kimitoOrange,
          }}
        />
      </View>
    </View>
  );
}
