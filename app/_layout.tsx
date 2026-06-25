import "@/global.css";
import { ClerkProvider, getClerkInstance, useAuth as useClerkAuth } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View, Text } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { LoginSuccessProvider } from "@/lib/login-success-context";
import { LoginSuccessModalWrapper } from "@/components/molecules/login-success-modal-wrapper";
import { OfflineBanner } from "@/components/organisms/offline-banner";
import { ToastProvider } from "@/components/atoms/toast";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient, setClerkTokenGetter } from "@/lib/trpc";
import { createPerformanceQueryCache, createPerformanceMutationCache } from "@/lib/performance-auto-monitor";
import { asyncStoragePersister } from "@/lib/query-persister";
import { preloadCriticalImages } from "@/lib/image-preload";
import { registerServiceWorker } from "@/lib/service-worker";
import { initAutoSync } from "@/lib/offline-sync";
import { startNetworkMonitoring, stopNetworkMonitoring } from "@/lib/api";
import { initSyncHandlers } from "@/lib/sync-handlers";
import { AutoLoginProvider } from "@/lib/auto-login-provider";
import { NetworkToast } from "@/components/organisms/network-toast";
import { initSentry } from "@/lib/sentry";
import { ErrorBoundary } from "@/components/ui";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

const tokenCache = {
  async getToken(key: string) {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

type ClerkGetToken = ReturnType<typeof useClerkAuth>["getToken"];

type AuthDebugPayload = {
  checkedAt: string;
  hasToken: boolean;
  tokenLength: number;
  authMeStatus: number | null;
  authMeOk: boolean | null;
};

async function resolveWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation, timeout]);
    if (timedOut) {
      console.warn(`[Auth] ${label} timed out after ${timeoutMs}ms`);
    }
    return result;
  } catch (error) {
    console.warn(`[Auth] ${label} failed:`, error);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readClerkToken(getToken: ClerkGetToken): Promise<string | null> {
  const freshToken = await resolveWithTimeout(
    getToken({ skipCache: true }),
    2500,
    "Fresh Clerk token fetch",
  );
  if (freshToken) return freshToken;

  const cachedToken = await resolveWithTimeout(getToken(), 1500, "Cached Clerk token fetch");
  if (cachedToken) return cachedToken;

  try {
    const clerk = getClerkInstance();
    const sessionTokenRequest = clerk?.session?.getToken({ skipCache: true });
    if (!sessionTokenRequest) return null;
    const sessionToken = await resolveWithTimeout(
      sessionTokenRequest,
      1500,
      "Clerk session token fallback",
    );
    return sessionToken ?? null;
  } catch (error) {
    console.warn("[Auth] Clerk session token fallback failed:", error);
    return null;
  }
}

function isAuthDebugRequested() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("romiAuthDebug")
  );
}

function AuthDebugPanel({ payload }: { payload: AuthDebugPayload | null }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: 8,
        bottom: 76,
        zIndex: 9999,
        maxWidth: 520,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: "rgba(0,0,0,0.86)",
      }}
    >
      <Text selectable style={{ color: "#22C55E", fontSize: 11, fontFamily: "monospace" }}>
        ROMI_AUTH_DEBUG {JSON.stringify(payload ?? { status: "pending" })}
      </Text>
    </View>
  );
}

function ClerkAwareTRPCProvider({ children }: { children: ReactNode }) {
  const { getToken } = useClerkAuth();
  const getTokenRef = useRef(getToken);
  const [authDebugEnabled, setAuthDebugEnabled] = useState(false);
  const [authDebugPayload, setAuthDebugPayload] = useState<AuthDebugPayload | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
    setClerkTokenGetter(() => readClerkToken(getTokenRef.current));
  }, [getToken]);

  useEffect(() => {
    if (isAuthDebugRequested()) {
      setAuthDebugEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!authDebugEnabled || typeof window === "undefined") return;

    let canceled = false;
    const debugWindow = window as typeof window & {
      __ROMI_AUTH_DEBUG__?: AuthDebugPayload;
    };

    function publishAuthDebug(payload: AuthDebugPayload) {
      debugWindow.__ROMI_AUTH_DEBUG__ = payload;
      setAuthDebugPayload(payload);
      try {
        document.documentElement.setAttribute("data-romi-auth-debug", JSON.stringify(payload));
      } catch {
        // Some browser automation contexts expose a read-only DOM shim.
      }
    }

    async function runAuthDebugProbe() {
      const token = await readClerkToken(getTokenRef.current);
      let authMeStatus: number | null = null;
      let authMeOk: boolean | null = null;

      if (token) {
        try {
          const response = await fetch("/api/trpc/auth.me?batch=1&input=%7B%7D", {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          authMeStatus = response.status;
          authMeOk = response.ok;
        } catch {
          authMeStatus = 0;
          authMeOk = false;
        }
      }

      if (!canceled) {
        publishAuthDebug({
          checkedAt: new Date().toISOString(),
          hasToken: !!token,
          tokenLength: token?.length ?? 0,
          authMeStatus,
          authMeOk,
        });
      }
    }

    const timers = [0, 1500, 4000].map((delay) =>
      setTimeout(() => {
        void runAuthDebugProbe();
      }, delay),
    );
    return () => {
      canceled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [authDebugEnabled]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: createPerformanceQueryCache(),
        mutationCache: createPerformanceMutationCache(),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30 * 60 * 1000,
            gcTime: 2 * 60 * 60 * 1000,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    createTRPCClient({ getToken: () => readClerkToken(getTokenRef.current) }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        {children}
        {authDebugEnabled ? <AuthDebugPanel payload={authDebugPayload} /> : null}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    const sentryTimer = setTimeout(() => { initSentry(); }, 2000);
    preloadCriticalImages();
    registerServiceWorker();
    initSyncHandlers();
    const unsubscribeSync = initAutoSync();
    startNetworkMonitoring();
    return () => {
      clearTimeout(sentryTimer);
      unsubscribeSync();
      stopNetworkMonitoring();
    };
  }, []);

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

  // 方式A(Clerk インスタンス共有): surechigai-romi.link は kimito の Clerk(clerk.kimito.link)を
  // サテライトドメインとして共有する。EXPO_PUBLIC_CLERK_IS_SATELLITE=true のときだけ satellite 化。
  // (env が無い=従来どおりの単独インスタンス動作。安全側のフォールバック)
  const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE === "true";
  const satelliteDomain = process.env.EXPO_PUBLIC_CLERK_DOMAIN; // 例: surechigai-romi.link
  const primarySignInUrl = process.env.EXPO_PUBLIC_CLERK_SIGN_IN_URL; // 例: https://kimito.link/sign-in
  const clerkSatelliteProps = isSatellite
    ? {
        isSatellite: true as const,
        domain: satelliteDomain,
        satelliteAutoSync: true,
        ...(primarySignInUrl ? { signInUrl: primarySignInUrl } : {}),
      }
    : {};

  const content = (
    <ErrorBoundary screenName="App">
      <GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}>
        {isMissingClerkKey ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D1117", padding: 20 }}>
            <Text style={{ color: "#F87171", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>セットアップエラー</Text>
            <Text style={{ color: "#E6EDF3", fontSize: 16, textAlign: "center", marginBottom: 20 }}>
              Clerkの公開鍵 (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) が設定されていません。
              VercelのEnvironment Variables、またはローカルの.envを確認してください。
            </Text>
          </View>
        ) : (
          <ClerkAwareTRPCProvider>
            <AutoLoginProvider>
              <LoginSuccessProvider>
                <ToastProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                  <StatusBar style="auto" />
                  <LoginSuccessModalWrapper />
                  <OfflineBanner />
                  <NetworkToast />
                </ToastProvider>
              </LoginSuccessProvider>
            </AutoLoginProvider>
          </ClerkAwareTRPCProvider>
        )}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (isMissingClerkKey) {
    return (
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {content}
      </SafeAreaProvider>
    );
  }

  if (shouldOverrideSafeArea) {
    return (
      <ClerkProvider
        publishableKey={clerkKey!}
        tokenCache={tokenCache}
        {...clerkSatelliteProps}
      >
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={providerInitialMetrics}>
            <SafeAreaFrameContext.Provider value={frame}>
              <SafeAreaInsetsContext.Provider value={insets}>
                {content}
              </SafeAreaInsetsContext.Provider>
            </SafeAreaFrameContext.Provider>
          </SafeAreaProvider>
        </ThemeProvider>
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey!}
      tokenCache={tokenCache}
      {...clerkSatelliteProps}
    >
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
