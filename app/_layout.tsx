import "@/lib/bootstrap/global-css";
import "@/lib/bootstrap/reanimated-init";
// @ts-nocheck
import { usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppNavigationStack } from "@/components/providers/app-navigation-stack";
import { Platform, View, Text } from "react-native";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ErrorBoundaryLite } from "@/components/ui/error-boundary-lite";
import {
  shouldDeferTrpcOnGuestWeb,
  shouldUseGuestWebShell,
} from "@/lib/clerk-public-routes";
import { startDeferredWebBootstrap } from "@/lib/bootstrap/web-bootstrap";
import { prefetchGuestTabChunks, prefetchHeavyTabChunks, prefetchGuestEventsImmediate } from "@/lib/bootstrap/prefetch-tab-chunks";
import { isGuestAppWebRoute } from "@/lib/clerk-public-routes";
import { GuestWebProviders } from "@/components/providers/guest-web-providers";
import { GuestAuthProvider, AuthContextProvider, type AuthState } from "@/lib/auth-context";
import { GestureRoot } from "@/components/providers/gesture-root";
import { WebDocumentHead } from "@/components/brand/web-document-head";

/**
 * ★重要: ClerkRootProvider は lazy() ではなく手動 import で読み込む。
 * 理由(2026-07-11 実測で発見した重大バグ): lazy()+Suspense で {stack}(=AppNavigationStack,
 * React NavigationのStack/Tabs一式)を子として渡すと、chunk解決までの間 stack が
 * Reactツリーから一度アンマウントされ、解決後に再マウントされる。この再マウント時に
 * React Navigationが「URLに基づく初期state」ではなく既定のindex(=先頭タブ"index"/"/")
 * から作り直され、window.history.replaceState('/') を呼ぶ。結果、認証済みユーザーが
 * /map 等どのタブへ直接アクセス(フルページロード)しても例外なく "/" へ落ちる
 * (タブクリックでの遷移は再マウントを経ないため無症状=長期間気づかれなかった)。
 * 対策: chunk自体は動的importのまま(バンドル分割は維持)、Suspenseで stack を
 * アンマウントさせず、モジュール解決を useState+useEffect で管理する。
 */
type ClerkRootProviderComponentType = (props: { children: ReactNode }) => ReactNode;
type AuthProviderComponents = {
  ClerkRootProvider: ClerkRootProviderComponentType;
  OnboardingGate: ClerkRootProviderComponentType;
};
let authProvidersPromise: Promise<AuthProviderComponents> | null = null;
function loadAuthProviders(): Promise<AuthProviderComponents> {
  if (!authProvidersPromise) {
    authProvidersPromise = Promise.all([
      import("@/components/providers/clerk-root-provider"),
      import("@/components/providers/onboarding-gate"),
    ]).then(([clerk, gate]) => ({
      ClerkRootProvider: clerk.ClerkRootProvider,
      OnboardingGate: gate.OnboardingGate,
    }));
  }
  return authProvidersPromise;
}
/** ClerkRootProvider と OnboardingGate の両chunkが揃ったら一括で返す(揃うまで null)。 */
function useAuthProviderComponents(): AuthProviderComponents | null {
  const [components, setComponents] = useState<AuthProviderComponents | null>(null);
  useEffect(() => {
    let canceled = false;
    void loadAuthProviders().then((m) => {
      if (!canceled) setComponents(m);
    });
    return () => {
      canceled = true;
    };
  }, []);
  return components;
}

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

/**
 * ★ディープリンク自己復元(2026-07-11 実測バグの恒久対策):
 * 認証プロバイダ(動的import)の解決時にラッパー構成が
 * 「placeholder → OnboardingGate>ClerkRootProvider」へ切り替わる。Reactは親の型系譜が
 * 変わった子を必ずアンマウントするため、stack(React Navigation一式)はこの瞬間に
 * 再マウントされ、ナビゲーション状態が既定(先頭タブ"/")から作り直される。
 * → 結果、認証済みユーザーの /map 等への直アクセスが例外なく "/" に落ちていた。
 * Suspense/lazyを外しても「ラッパー差し替え=子の再マウント」は構造的に避けられないため、
 * モジュール評価時(ルーターが動く前)に元のURLを捕捉し、再マウント後に "/" へ
 * 戻されていたら一度だけ元のパスへ戻す。
 */
const INITIAL_WEB_PATH =
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.pathname}${window.location.search}`
    : null;

function RestoreDeepLinkAfterAuthBoot() {
  const router = useRouter();
  const pathname = usePathname();
  const doneRef = useRef(false);
  const userInteractedRef = useRef(false);

  // ユーザーが自分でタブ移動した場合は復元しない(意図の尊重)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mark = () => {
      userInteractedRef.current = true;
    };
    window.addEventListener("pointerdown", mark, true);
    window.addEventListener("keydown", mark, true);
    return () => {
      window.removeEventListener("pointerdown", mark, true);
      window.removeEventListener("keydown", mark, true);
    };
  }, []);

  // 固定タイマーではなく pathname の変化に反応する:
  // chunk解決が遅い環境では "/" への転落がマウントから1秒以上後に起きるため、
  // タイマー方式だと競走に負ける(実測)。転落を検知した瞬間に一度だけ復元する。
  useEffect(() => {
    if (doneRef.current) return;
    if (!INITIAL_WEB_PATH || INITIAL_WEB_PATH === "/") {
      doneRef.current = true;
      return;
    }
    if (userInteractedRef.current) {
      doneRef.current = true;
      return;
    }
    // ブート起因の転落はページ読込から十数秒以内に起きる。それ以降は関与しない
    if (typeof performance !== "undefined" && performance.now() > 15000) {
      doneRef.current = true;
      return;
    }
    if (pathname === "/") {
      doneRef.current = true;
      router.replace(INITIAL_WEB_PATH as never);
    }
  }, [pathname, router]);
  return null;
}

/** ClerkRootProvider chunk 解決待ちの一瞬だけ配る、安全な「ロード中」AuthState。 */
const AUTH_LOADING_PLACEHOLDER: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isAuthReady: false,
  isAuthReadyForUI: false,
  refresh: async () => {},
  logout: async () => {},
  login: async () => {},
};

/**
 * +html.tsx が掛けたブートベール（data-auth-boot）を外す。
 * このモジュールの実コードを変えると _layout チャンクが改名される点も利用している
 * （CDNキャッシュ地雷の汚染払い。docs/investigation 参照）。
 */
function releaseBootVeil(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-auth-boot");
}

function MissingClerkKeyScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F0F4F8",
        padding: 20,
      }}
    >
      <Text style={{ color: "#DC2626", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        セットアップエラー
      </Text>
      <Text style={{ color: "#334155", fontSize: 16, textAlign: "center", marginBottom: 20 }}>
        Clerkの公開鍵 (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) が設定されていません。
        VercelのEnvironment Variables、またはローカルの.envを確認してください。
      </Text>
    </View>
  );
}

function AppShell({ children, liteBoundary = false }: { children: ReactNode; liteBoundary?: boolean }) {
  const Boundary = liteBoundary ? ErrorBoundaryLite : ErrorBoundary;
  const Shell = liteBoundary && Platform.OS === "web" ? View : GestureRoot;
  return (
    <Boundary screenName="App">
      <Shell style={{ flex: 1, overflow: "hidden", backgroundColor: "#F0F4F8" }}>
        {children}
      </Shell>
    </Boundary>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const pathname = usePathname();
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets] = useState<EdgeInsets>(initialInsets);
  const [frame] = useState<Rect>(initialFrame);

  const useGuestWebShell = Platform.OS === "web" && shouldUseGuestWebShell(pathname);
  const deferNativeWind = useGuestWebShell && shouldDeferTrpcOnGuestWeb(pathname);

  // +html.tsx のブートベール解除（React がマウントした瞬間に本物のUIへ引き継ぐ）
  useEffect(() => {
    releaseBootVeil();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const cancelBootstrap = startDeferredWebBootstrap();
      const cancelPrefetch = useGuestWebShell ? prefetchGuestTabChunks() : prefetchHeavyTabChunks();
      return () => {
        cancelBootstrap();
        cancelPrefetch();
      };
    }

    void (async () => {
      const [{ registerServiceWorker }, { setupChunkRecover }, { initSentry }] =
        await Promise.all([
          import("@/lib/service-worker"),
          import("@/lib/pwa/chunk-recover"),
          import("@/lib/sentry"),
        ]);
      registerServiceWorker();
      setupChunkRecover();
      setTimeout(() => {
        void initSentry();
      }, 2000);
    })();
  }, [useGuestWebShell]);

  useEffect(() => {
    if (Platform.OS !== "web" || !useGuestWebShell) return;
    if (isGuestAppWebRoute(pathname) && (pathname === "/events" || pathname.startsWith("/events/"))) {
      prefetchGuestEventsImmediate();
    }
  }, [pathname, useGuestWebShell]);

  useEffect(() => {
    if (useGuestWebShell) return;
    void import("@/lib/api").then(({ startNetworkMonitoring, stopNetworkMonitoring }) => {
      startNetworkMonitoring();
    });
    return () => {
      void import("@/lib/api").then(({ stopNetworkMonitoring }) => stopNetworkMonitoring());
    };
  }, [useGuestWebShell]);

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isMissingClerkKey = !clerkKey;

  // stack は「同一の要素インスタンス」としてどの分岐でも同じ位置に描画する。
  // 認証プロバイダ chunk の解決待ちを理由に stack ごとアンマウントしない(上のコメント参照)。
  const stack = <AppNavigationStack />;
  const authProviders = useAuthProviderComponents();

  let appContent: ReactNode;
  if (isMissingClerkKey) {
    appContent = <MissingClerkKeyScreen />;
  } else if (useGuestWebShell) {
    appContent = (
      <GuestAuthProvider>
        <GuestWebProviders>{stack}</GuestWebProviders>
      </GuestAuthProvider>
    );
  } else if (authProviders) {
    const { ClerkRootProvider, OnboardingGate } = authProviders;
    appContent = (
      <OnboardingGate>
        <ClerkRootProvider>
          {stack}
          <RestoreDeepLinkAfterAuthBoot />
        </ClerkRootProvider>
      </OnboardingGate>
    );
  } else {
    // 両chunk解決待ちの一瞬だけ: useAuth() が「AuthProvider外」で例外を投げないよう、
    // isAuthReady=false の安全なプレースホルダ値を配る。stack はそのまま描画し続ける
    // (これが今回の修正の要: stack を絶対にアンマウントしない)。
    // (tabs)配下の全画面は isAuthReady/isAuthReadyForUI でローディング分岐する既存設計。
    appContent = (
      <AuthContextProvider value={AUTH_LOADING_PLACEHOLDER}>{stack}</AuthContextProvider>
    );
  }

  const shouldOverrideSafeArea = Platform.OS === "web";

  return (
    <ThemeProvider deferNativeWind={deferNativeWind}>
      <WebDocumentHead />
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {shouldOverrideSafeArea ? (
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              <AppShell liteBoundary={useGuestWebShell}>{appContent}</AppShell>
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        ) : (
          <AppShell liteBoundary={useGuestWebShell}>{appContent}</AppShell>
        )}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
