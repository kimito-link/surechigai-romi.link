/**
 * Clerk + 認証付き tRPC Provider（dynamic import 専用 chunk）。
 * _layout.tsx から @clerk/expo の静的 import を除去するため分離。
 */
// @ts-nocheck
import { ClerkProvider, getClerkInstance, useAuth as useClerkAuth } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Platform, View, Text } from "react-native";
import { LoginSuccessProvider } from "@/lib/login-success-context";
import { LoginSuccessModalWrapper } from "@/components/molecules/login-success-modal-wrapper";
import { AuthHandoffProvider } from "@/lib/auth-handoff-context";
import { OfflineBanner } from "@/components/organisms/offline-banner";
import { ToastProvider } from "@/components/atoms/toast";
import { TextScaleProvider } from "@/lib/text-scale";
import { trpc, createTRPCClient, setClerkTokenGetter } from "@/lib/trpc";
import { createPerformanceQueryCache, createPerformanceMutationCache } from "@/lib/performance-auto-monitor";
import { asyncStoragePersister } from "@/lib/query-persister";
import { shouldPersistQuery } from "@/lib/query-persist-policy";
import { AuthQuerySync } from "@/lib/query-auth-sync";
import { AuthenticatedPresenceShell } from "@/components/presence/authenticated-presence-shell";
import { getClerkProviderProps } from "@/lib/clerk-provider-props";
import { NetworkToast } from "@/components/organisms/network-toast";
import { ClerkAuthBridge } from "@/components/providers/clerk-auth-bridge";
import { TabPrefetchProvider } from "@/hooks/use-tab-prefetch";

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
  protectedStatus: number | null;
  protectedOk: boolean | null;
};

/**
 * トークン取得の暴走防止（2026-07-04 障害対応）:
 * 旧実装は全APIコールごとに skipCache:true のフレッシュ取得を最初に行っており、
 * Clerk のトークンAPIをリクエスト嵐にして 429 → 無トークンで401 → クエリ再試行 →
 * さらに429、の雪だるまを起こしていた（実測: 数秒で1000リクエスト超・タブ凍結）。
 * 対策: (1) Clerk内部キャッシュ優先 (2) モジュール単一の in-flight 共有
 * (3) 45秒メモ（トークン寿命60秒より短く） (4) 429時は20秒クールダウン。
 */
const TOKEN_MEMO_MS = 45_000;
const RATE_LIMIT_COOLDOWN_MS = 20_000;
let tokenMemo: { value: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string | null> | null = null;
let tokenRateLimitedUntil = 0;

function resetClerkTokenMemo(): void {
  tokenMemo = null;
  tokenInFlight = null;
  tokenRateLimitedUntil = 0;
}

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429) return true;
  return /\b429\b|too many/i.test(String((error as Error | null)?.message ?? ""));
}

async function fetchTokenOnce(
  operation: Promise<string | null> | undefined,
  timeoutMs: number,
  label: string,
): Promise<string | null> {
  if (!operation) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      operation,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
    return result ?? null;
  } catch (error) {
    if (isRateLimitError(error)) {
      tokenRateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      console.warn(`[Auth] ${label} rate limited (429). cooling down.`);
    } else {
      console.warn(`[Auth] ${label} failed:`, error);
    }
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readClerkToken(getToken: ClerkGetToken): Promise<string | null> {
  const now = Date.now();
  if (tokenMemo && now < tokenMemo.expiresAt) return tokenMemo.value;
  if (now < tokenRateLimitedUntil) return tokenMemo?.value ?? null;
  if (tokenInFlight) return tokenInFlight;

  tokenInFlight = (async () => {
    try {
      // キャッシュ優先（Clerk内部キャッシュがあれば即時解決・ネットワーク往復なし）
      let token = await fetchTokenOnce(getToken(), 3_000, "Clerk token fetch");
      if (!token) {
        // React フック経由の getToken が null を返す環境があるため、
        // Clerk インスタンスのセッションを直接叩く（実機で最も確実に通る経路。
        // 旧実装で実働していたのはこの脚だった — 削除しないこと）。
        try {
          const clerk = getClerkInstance();
          token = await fetchTokenOnce(
            clerk?.session?.getToken(),
            3_000,
            "Clerk session token fallback",
          );
        } catch (error) {
          console.warn("[Auth] Clerk instance unavailable:", error);
        }
      }
      if (!token && Date.now() >= tokenRateLimitedUntil) {
        token = await fetchTokenOnce(
          getToken({ skipCache: true }),
          3_000,
          "Fresh Clerk token fetch",
        );
      }
      if (token) {
        tokenMemo = { value: token, expiresAt: Date.now() + TOKEN_MEMO_MS };
      }
      return token;
    } finally {
      tokenInFlight = null;
    }
  })();
  return tokenInFlight;
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
    // セッション（getToken の identity）が変わったらメモを破棄して取り直す
    resetClerkTokenMemo();
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
        // read-only DOM shim in automation
      }
    }

    async function runAuthDebugProbe() {
      const token = await readClerkToken(getTokenRef.current);
      let protectedStatus: number | null = null;
      let protectedOk: boolean | null = null;

      if (token) {
        try {
          const response = await fetch("/api/trpc/settings.get?batch=1&input=%7B%7D", {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          protectedStatus = response.status;
          protectedOk = response.ok;
        } catch {
          protectedStatus = 0;
          protectedOk = false;
        }
      }

      if (!canceled) {
        publishAuthDebug({
          checkedAt: new Date().toISOString(),
          hasToken: !!token,
          tokenLength: token?.length ?? 0,
          protectedStatus,
          protectedOk,
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
        persistOptions={{
          persister: asyncStoragePersister,
          dehydrateOptions: {
            shouldDehydrateQuery: shouldPersistQuery,
          },
        }}
      >
        <AuthQuerySync />
        <AuthenticatedPresenceShell />
        <TabPrefetchProvider>{children}</TabPrefetchProvider>
        {authDebugEnabled ? <AuthDebugPanel payload={authDebugPayload} /> : null}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}

function ClerkAppShell({ children }: { children: ReactNode }) {
  return (
    <ClerkAuthBridge>
      <ClerkAwareTRPCProvider>
        <AuthHandoffProvider>
          <LoginSuccessProvider>
            <ToastProvider>
              <TextScaleProvider>
                {children}
                <LoginSuccessModalWrapper />
                <OfflineBanner />
                <NetworkToast />
              </TextScaleProvider>
            </ToastProvider>
          </LoginSuccessProvider>
        </AuthHandoffProvider>
      </ClerkAwareTRPCProvider>
    </ClerkAuthBridge>
  );
}

export function ClerkRootProvider({ children }: { children: ReactNode }) {
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) {
    throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing");
  }

  const clerkBrandProps = getClerkProviderProps();

  return (
    <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache} {...clerkBrandProps}>
      <ClerkAppShell>{children}</ClerkAppShell>
    </ClerkProvider>
  );
}
