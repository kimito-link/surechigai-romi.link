import "@/lib/bootstrap/global-css";
import "@/lib/bootstrap/reanimated-init";
// @ts-nocheck
import { usePathname } from "expo-router";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { prefetchGuestTabChunks, prefetchHeavyTabChunks } from "@/lib/bootstrap/prefetch-tab-chunks";
import { GuestWebProviders } from "@/components/providers/guest-web-providers";
import { GuestAuthProvider } from "@/lib/auth-context";
import { AppBootstrapFallback } from "@/components/providers/app-bootstrap-fallback";
import { GestureRoot } from "@/components/providers/gesture-root";
import { WebDocumentHead } from "@/components/brand/web-document-head";
import { OnboardingWrapper } from "@/components/providers/onboarding-wrapper";
import { OnboardingProvider } from "@/features/onboarding/context/OnboardingProvider";

const ClerkRootProvider = lazy(() =>
  import("@/components/providers/clerk-root-provider").then((m) => ({
    default: m.ClerkRootProvider,
  })),
);

const AppNavigationStack = lazy(() =>
  import("@/components/providers/app-navigation-stack").then((m) => ({
    default: m.AppNavigationStack,
  })),
);

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

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

  const stack = (
    <Suspense fallback={useGuestWebShell ? null : <AppBootstrapFallback />}>
      <AppNavigationStack />
    </Suspense>
  );

  let shellContent: ReactNode;
  if (isMissingClerkKey) {
    shellContent = <MissingClerkKeyScreen />;
  } else if (useGuestWebShell) {
    shellContent = (
      <GuestAuthProvider>
        <GuestWebProviders>{stack}</GuestWebProviders>
      </GuestAuthProvider>
    );
  } else {
    shellContent = (
      <Suspense fallback={<AppBootstrapFallback />}>
        <ClerkRootProvider>{stack}</ClerkRootProvider>
      </Suspense>
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
              <AppShell liteBoundary={useGuestWebShell}>
                {useGuestWebShell ? (
                  shellContent
                ) : (
                  <OnboardingProvider>
                    <OnboardingWrapper>{shellContent}</OnboardingWrapper>
                  </OnboardingProvider>
                )}
              </AppShell>
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        ) : (
          <AppShell liteBoundary={useGuestWebShell}>
            {useGuestWebShell ? (
              shellContent
            ) : (
              <OnboardingProvider>
                <OnboardingWrapper>{shellContent}</OnboardingWrapper>
              </OnboardingProvider>
            )}
          </AppShell>
        )}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
