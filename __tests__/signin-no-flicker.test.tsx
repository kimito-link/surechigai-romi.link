/**
 * sign-in の「ちらつきゼロ契約」を固定する（正本: web-ios-android/templates/web/auth-mode/README.md ④、
 * _docs 側の判断: web-ios-android/_docs/DESIGN-signin-no-flicker-2026-10-05.md）。
 *
 * 守ること:
 *   1. 到着時に全画面を被せない — SignInAuthHandoffOverlay はマウント直後も、時間が経っても何も描かない
 *      （以前は INTRO_MS=1100ms の紺の全画面 intro があり、本家 before でフラッシュ 2 枚の原因だった）
 *   2. プレースホルダは本物と同寸 — 箱モデルの式が本番 DOM 実測（2026-10-05、iPhone 15 Pro Max）と一致する:
 *      Web = Clerk カード 486px（3 プロバイダ）、ネイティブ = clerk-sign-in.tsx の 2 ボタン 108px
 *   3. Expo の ClerkMountFallback は Web では本物と同じ 3 ボタン、ネイティブでは本物と同じ 2 ボタンを押せる形で描く
 *   4. Next.js 側（apps/web。本番 /sign-in/ はこちらが応答する）は `<SignIn fallback={<ClerkMountFallback/>}/>` を持ち、
 *      その箱モデルの数値はルートの lib/clerk-card-box-model.ts と同じ（apps/web は別パッケージで import できないため
 *      意図的な複製。ここで突き合わせる）
 *
 * ★3 の実寸（px）は jsdom では測れない。実寸は web-ios-android/templates/scripts/qa/measure-page-flicker.mjs で
 *   本番の前後を同じ条件で測る（before: qa/evidence/2026-10-05_signin-flicker/before/summary.txt）。
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import {
  CLERK_CARD_BOX_MODEL,
  CLERK_CARD_PROVIDERS,
  NATIVE_SIGN_IN_BOX_MODEL,
  clerkCardBoxWidth,
  clerkCardHeaderHeight,
  expectedClerkCardBoxHeight,
  expectedNativeSignInHeight,
} from "@/lib/clerk-card-box-model";
import { authBrandConfig as webAuthBrandConfig } from "../apps/web/lib/auth-brand.config";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

// ★react-native のモック。Platform.OS は可変にして、同じモジュール実体のまま web / native を切り替える
//   （vi.resetModules で React を二重化すると hooks が壊れるため、再 import しない）。
const rn = vi.hoisted(() => {
  const platform = { OS: "web" as string };
  const windowSize = { width: 430, height: 932 };
  return { platform, windowSize };
});

vi.mock("react-native", async () => {
  const React = await import("react");
  type AnyProps = Record<string, unknown> & { children?: unknown; style?: unknown };
  const dom =
    (tag: string) =>
    ({ children, style, testID, accessibilityRole, accessibilityLabel, onPress, ...rest }: AnyProps) =>
      React.createElement(
        tag,
        {
          "data-testid": testID,
          "data-style": JSON.stringify(style ?? null),
          role: accessibilityRole === "button" ? "button" : undefined,
          "aria-label": accessibilityLabel,
          onClick: onPress,
          ...Object.fromEntries(Object.entries(rest).filter(([k]) => !/^[a-z]/.test(k) || k === "id")),
        },
        children as React.ReactNode,
      );
  class AnimatedValue {
    v: number;
    constructor(v: number) {
      this.v = v;
    }
    interpolate() {
      return 0;
    }
  }
  const noopAnim = () => ({ start() {}, stop() {} });
  return {
    Platform: rn.platform,
    View: dom("div"),
    Text: dom("span"),
    Pressable: dom("button"),
    useWindowDimensions: () => rn.windowSize,
    Animated: { Value: AnimatedValue, View: dom("div"), loop: noopAnim, sequence: noopAnim, timing: noopAnim },
    Easing: { out: () => 0, in: () => 0, inOut: () => 0, quad: 0, ease: 0 },
  };
});
vi.mock("react-native-svg", () => ({ default: () => null, Path: () => null }));
vi.mock("expo-image", () => ({ Image: () => null }));
vi.mock("@/theme/tokens", () => ({
  palette: { kimitoBlue: "#00427B", kimitoOrange: "#DD6500", white: "#FFFFFF" },
}));
const handoff = { hideHandoff: vi.fn(), showHandoff: vi.fn(), visible: false, provider: "x" };
vi.mock("@/lib/auth-handoff-context", () => ({ useAuthHandoff: () => handoff }));
const login = vi.fn();
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ login }) }));

const { SignInAuthHandoffOverlay } = await import("@/components/auth/sign-in-auth-handoff-overlay");
const { ClerkMountFallback } = await import("@/components/auth/clerk-mount-fallback");

afterEach(() => {
  cleanup();
  login.mockReset();
  rn.platform.OS = "web";
  vi.useRealTimers();
});

describe("契約 1: 到着時に全画面を被せない（SignInAuthHandoffOverlay）", () => {
  it("マウント直後に何も描かず、1.5 秒経っても何も描かない（到着 intro が無い）", () => {
    vi.useFakeTimers();
    const { container } = render(<SignInAuthHandoffOverlay />);
    expect(container.innerHTML).toBe("");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(container.innerHTML).toBe("");
    expect(container.querySelector("[data-testid='auth-handoff-overlay']")).toBeNull();
  });

  it("Clerk のソーシャルボタンが押されたときだけ全画面を描く（押下後の handoff は残す）", () => {
    const { container } = render(<SignInAuthHandoffOverlay />);
    const btn = document.createElement("button");
    btn.className = "cl-socialButtonsBlockButton cl-socialButtonsBlockButton__x";
    btn.textContent = "X / Twitterで続ける";
    document.body.appendChild(btn);
    act(() => {
      fireEvent.click(btn);
    });
    const overlay = container.querySelector("[data-testid='auth-handoff-overlay']");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toContain("Xの画面に少し変わります");
    btn.remove();
  });

  it("ソースに到着 intro（INTRO_MS / phase \"intro\"）が戻っていない", () => {
    // コメント（撤去の経緯に INTRO_MS と書いてある）は剥がしてから見る（signin-fallback-is-pressable.test と同じ流儀）
    const src = read("components/auth/sign-in-auth-handoff-overlay.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split(/\r?\n/)
      .map((l) => l.replace(/(^|\s)\/\/.*$/, "$1"))
      .join("\n");
    expect(src).not.toMatch(/INTRO_MS/);
    expect(src).not.toMatch(/["']intro["']/);
    expect(src).not.toMatch(/MutationObserver/);
  });
});

describe("契約 2: 箱モデルは本番 DOM 実測（2026-10-05）と一致する", () => {
  it("Web の Clerk カード: header 128 / cardBox 486（3 プロバイダ）= before の縦ずれ +486px", () => {
    expect(clerkCardHeaderHeight()).toBe(128);
    expect(expectedClerkCardBoxHeight(CLERK_CARD_PROVIDERS.length)).toBe(486);
    // ボタンが 1 つ増えるごとに 48 + 10 = 58px
    expect(expectedClerkCardBoxHeight(4) - expectedClerkCardBoxHeight(3)).toBe(58);
    // .cl-cardBox の幅: 25rem と calc(100vw - 2.5rem) の小さい方（430px で 390px、デスクトップで 400px）
    expect(clerkCardBoxWidth(430)).toBe(390);
    expect(clerkCardBoxWidth(1280)).toBe(400);
  });

  it("本番 Clerk Dashboard の構成は X / Apple / Google の 3 つで X が主役", () => {
    expect(CLERK_CARD_PROVIDERS.map((p) => p.key)).toEqual(["x", "apple", "google"]);
    expect(CLERK_CARD_PROVIDERS.filter((p) => p.hero).map((p) => p.key)).toEqual(["x"]);
  });

  it("ネイティブの本物（clerk-sign-in.tsx）は 2 ボタン・minHeight 48・gap 12 = 108px", () => {
    expect(expectedNativeSignInHeight()).toBe(108);
    // 本物側のソースの数値がずれていないこと（ここを変えたら NATIVE_SIGN_IN_BOX_MODEL も変える）
    const real = read("components/organisms/clerk-sign-in.tsx");
    expect(real).toMatch(new RegExp(`gap:\\s*${NATIVE_SIGN_IN_BOX_MODEL.buttonGap}\\b`));
    expect(real.match(new RegExp(`minHeight:\\s*${NATIVE_SIGN_IN_BOX_MODEL.buttonMinHeight}\\b`, "g"))).toHaveLength(
      NATIVE_SIGN_IN_BOX_MODEL.providerCount,
    );
    expect(real.match(/<Pressable/g)).toHaveLength(NATIVE_SIGN_IN_BOX_MODEL.providerCount);
  });
});

describe("契約 3: Expo の ClerkMountFallback は本物と同じ数の押せるボタンを描く", () => {
  it("Web: 本物の Clerk カードと同じ 3 ボタン（X 主役 / Apple / Google）。X・Apple は login(provider)、Google は切替用 URL", () => {
    rn.platform.OS = "web";
    const { container } = render(<ClerkMountFallback mode="sign-in" />);
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "X / Twitterで続ける",
      "Appleで続ける",
      "Googleで続ける",
    ]);
    // 高さはすべて本物と同じ 48px（style の height）
    for (const b of buttons) {
      expect(JSON.parse(b.getAttribute("data-style")!).height).toBe(CLERK_CARD_BOX_MODEL.buttonHeight);
    }
    fireEvent.click(buttons[0]);
    expect(login).toHaveBeenLastCalledWith(undefined, false, "x");
    fireEvent.click(buttons[1]);
    expect(login).toHaveBeenLastCalledWith(undefined, false, "apple");
    fireEvent.click(buttons[2]);
    expect(login).toHaveBeenLastCalledWith(undefined, true);
    // 見出し・補足・フッターの枠も最初から居る（本物と同じ構成）
    expect(container.textContent).toContain("君斗りんくのすれ違ひ通信にログイン");
    expect(container.textContent).toContain("アカウントをお持ちでないですか？");
  });

  it("ネイティブ: 本物（clerk-sign-in.tsx）と同じ 2 ボタンだけ。見出し・補足・余白を足さない", () => {
    rn.platform.OS = "ios";
    const { container } = render(<ClerkMountFallback mode="sign-in" />);
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["X（旧 Twitter）で続ける", "Apple で続ける"]);
    expect(container.textContent).not.toContain("君斗りんくのすれ違ひ通信にログイン");
    expect(container.textContent).not.toContain("アカウントをお持ちでないですか？");
    const root = JSON.parse(container.firstElementChild!.getAttribute("data-style")!);
    expect(root.gap).toBe(NATIVE_SIGN_IN_BOX_MODEL.buttonGap);
    fireEvent.click(buttons[0]);
    expect(login).toHaveBeenLastCalledWith(undefined, false, "x");
    fireEvent.click(buttons[1]);
    expect(login).toHaveBeenLastCalledWith(undefined, false, "apple");
  });
});

describe("契約 4: Next.js 側（apps/web、本番 /sign-in/ の応答元）", () => {
  const page = read("apps/web/app/(auth)/sign-in/[[...sign-in]]/page.tsx");
  const fallbackSrc = read("apps/web/components/ClerkMountFallback.tsx");

  it("<SignIn/> は 2 か所とも同寸プレースホルダを fallback に持つ（SSO コールバック中も）", () => {
    expect(page.match(/<SignIn\s+fallback=\{<ClerkMountFallback mode="sign-in" \/>\}\s*\/>/g)).toHaveLength(2);
    // JSX の行だけを見る（JSDoc の「Clerk 標準の <SignIn /> に丸投げする」は対象外）
    expect(page).not.toMatch(/^\s*(?:return\s+)?<SignIn\s*\/>/m);
    // 到着時の全画面（handoffOverlay スロット）は渡さない
    expect(page).not.toMatch(/handoffOverlay=/);
  });

  it("箱モデルの数値はルートの lib/clerk-card-box-model.ts と同じ（意図的な複製の同期検査）", () => {
    const shared = [
      "cardBoxWidthRem",
      "cardMarginPx",
      "cardPaddingY",
      "cardPaddingX",
      "cardGap",
      "logoHeight",
      "logoWidth",
      "headerGap",
      "titleLineHeight",
      "titleSubtitleGap",
      "subtitleLineHeight",
      "subtitleLines",
      "buttonHeight",
      "buttonGap",
      "footerActionHeight",
      "footerBadgeHeight",
    ] as const;
    for (const key of shared) {
      const value = CLERK_CARD_BOX_MODEL[key];
      expect(fallbackSrc, `apps/web の ${key} が ${value} ではない`).toMatch(
        new RegExp(`\\b${key}:\\s*${String(value).replace("-", "\\-")},`),
      );
    }
    expect(fallbackSrc).toMatch(/cardBoxMaxWidth:\s*"calc\(100vw - 2\.5rem\)"/);
    expect(CLERK_CARD_BOX_MODEL.cardBoxMaxWidthInsetPx).toBe(40); // = 2.5rem
  });

  it("プロバイダ設定（auth-brand.config の clerkCard）はルートの CLERK_CARD_PROVIDERS と同じ", () => {
    expect(webAuthBrandConfig.clerkCard.providers).toEqual(CLERK_CARD_PROVIDERS.map((p) => ({ ...p })));
    expect(webAuthBrandConfig.clerkCard.logoSrc).toBe("/pwa-icon-192.png");
  });
});
