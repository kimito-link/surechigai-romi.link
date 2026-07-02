import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { palette } from "@/theme/tokens";

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

function markFiredNow(): void {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // sessionStorage が使えない環境でも、effect 内の didClick で多重発火は防ぐ。
  }
}

function removeAutoXParam(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get(AUTO_PARAM) !== AUTO_VALUE) return;
  url.searchParams.delete(AUTO_PARAM);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function findClickableXButton(): HTMLElement | null {
  const matched = document.querySelector<HTMLElement>(X_BUTTON_SELECTOR);
  const candidates = matched
    ? [matched]
    : Array.from(
        document.querySelectorAll<HTMLElement>("button, a, [role='button']"),
      );

  for (const candidate of candidates) {
    const target =
      candidate.closest<HTMLElement>("button, a, [role='button']") ?? candidate;
    if (target.getAttribute("aria-disabled") === "true") continue;
    if (target instanceof HTMLButtonElement && target.disabled) continue;

    const hay = (
      (target.getAttribute("data-provider") || "") +
      " " +
      (target.getAttribute("aria-label") || "") +
      " " +
      (target.getAttribute("data-localization-key") || "") +
      " " +
      (target.className || "") +
      " " +
      (target.textContent || "")
    ).toLowerCase();
    if (/twitter|\bx\b/.test(hay)) return target;
  }

  return null;
}

/** kimito.link と同じ 1 タップ導線。Clerk 標準 SignIn を壊さず、X ボタンへ click を送る。 */
export function AutoAdvanceToX() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!hasAutoXParam() || isSsoCallback()) {
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
    }

    function tryClick() {
      if (didClick) return;
      const button = findClickableXButton();
      if (!button) return;

      didClick = true;
      markFiredNow();
      removeAutoXParam();
      cleanupTimers();
      button.click();
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
