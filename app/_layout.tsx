import "@/global.css";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
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
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { preloadCriticalImages } from "@/lib/image-preload";
import { registerServiceWorker } from "@/lib/service-worker";
import { initAutoSync } from "@/lib/offline-sync";
import { startNetworkMonitoring, stopNetworkMonitoring } from "@/lib/api";
import { initSyncHandlers } from "@/lib/sync-handlers";
import { AutoLoginProvider } from "@/lib/auto-login-provider";
import { TutorialProvider, useTutorial } from "@/lib/tutorial-context";
import { TutorialOverlay } from "@/components/organisms/tutorial-overlay";
import { UserTypeSelector } from "@/components/organisms/user-type-selector";
import { LoginPromptModal } from "@/components/organisms/login-prompt-modal";
import { NetworkToast } from "@/components/organisms/network-toast";
import { ExperienceProvider } from "@/lib/experience-context";
import { ExperienceOverlay } from "@/components/organisms/experience-overlay";
import { OnboardingScreen, useOnboarding } from "@/features/onboarding";
import { initSentry } from "@/lib/sentry";
import { ErrorBoundary } from "@/components/ui";
import { usePrefetchHome } from "@/hooks/use-prefetch";

/**
 * 繝槭え繝ｳ繝域凾縺ｫ繝帙・繝逕ｻ髱｢縺ｮ繝・・繧ｿ繧偵・繝ｪ繝輔ぉ繝・メ・・-1: 蛻晏屓陦ｨ遉ｺ蜑榊偵＠・・ * tRPC Provider 蜀・〒菴ｿ逕ｨ縺励√Ν繝ｼ繝医・繧ｦ繝ｳ繝域凾縺ｫ蜊ｳ蠎ｧ縺ｫ繝・・繧ｿ蜿門ｾ励ｒ髢句ｧ九☆繧・ */
function EarlyPrefetch() {
  const { prefetch } = usePrefetchHome();
  useEffect(() => {
    prefetch();
  }, [prefetch]);
  return null;
}

/** /admin 縺ｮ縺ｨ縺阪・繧ｪ繝ｼ繝舌・繝ｬ繧､繧貞・縺輔★邂｡逅・判髱｢縺縺題｡ｨ遉ｺ縺吶ｋ */
function useIsAdminRoute() {
  const pathname = usePathname();
  return typeof pathname === "string" && (pathname === "/admin" || pathname.startsWith("/admin/"));
}

function ConditionalExperienceOverlay() {
  if (useIsAdminRoute()) return null;
  return <ExperienceOverlay />;
}

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

function ClerkTokenSync() {
  const { getToken } = useClerkAuth();
  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);
  return null;
}

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * 繝√Η繝ｼ繝医Μ繧｢繝ｫUI・医Θ繝ｼ繧ｶ繝ｼ繧ｿ繧､繝鈴∈謚・+ 繝√Η繝ｼ繝医Μ繧｢繝ｫ繧ｪ繝ｼ繝舌・繝ｬ繧､・・ * /admin 縺ｮ縺ｨ縺阪・陦ｨ遉ｺ縺励↑縺・ｼ育ｮ｡逅・判髱｢縺ｮ繝代せ繝ｯ繝ｼ繝芽ｪ崎ｨｼ繧帝國縺輔↑縺・◆繧・ｼ・ */
function TutorialUI() {
  const tutorial = useTutorial();
  if (useIsAdminRoute()) return null;

  return (
    <>
      {/* 繝ｦ繝ｼ繧ｶ繝ｼ繧ｿ繧､繝鈴∈謚樒判髱｢ */}
      <UserTypeSelector
        visible={tutorial.showUserTypeSelector}
        onSelect={tutorial.selectUserType}
        onSkip={tutorial.skipTutorial}
      />
      
      {/* 繝√Η繝ｼ繝医Μ繧｢繝ｫ繧ｪ繝ｼ繝舌・繝ｬ繧､ */}
      {tutorial.currentStep && (
        <TutorialOverlay
          step={tutorial.currentStep}
          stepNumber={tutorial.currentStepIndex + 1}
          totalSteps={tutorial.totalSteps}
          onNext={tutorial.nextStep}
          onComplete={tutorial.completeTutorial}
          visible={tutorial.isActive}
        />
      )}
      
      {/* 繝√Η繝ｼ繝医Μ繧｢繝ｫ螳御ｺ・ｾ後・繝ｭ繧ｰ繧､繝ｳ隱伜ｰ弱Δ繝ｼ繝繝ｫ */}
      <LoginPromptModal
        visible={tutorial.showLoginPrompt}
        onLogin={tutorial.dismissLoginPrompt}
        onSkip={tutorial.dismissLoginPrompt}
      />
    </>
  );
}

/**
 * 繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ繝ｩ繝・ヱ繝ｼ
 * 蛻晏屓襍ｷ蜍墓凾縺ｫ繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ繧定｡ｨ遉ｺ・・admin 縺ｯ蟶ｸ縺ｫ繧ｹ繧ｭ繝・・縺励※邂｡逅・判髱｢縺ｸ・・ */
function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();

  // /admin 縺ｸ縺ｮ繧｢繧ｯ繧ｻ繧ｹ縺ｯ繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ繧貞・縺輔★縺ｫ邂｡逅・判髱｢・医ヱ繧ｹ繝ｯ繝ｼ繝芽ｪ崎ｨｼ・峨ｒ陦ｨ遉ｺ
  const isAdminRoute = typeof pathname === "string" && (pathname === "/admin" || pathname.startsWith("/admin/"));
  if (isAdminRoute) {
    return <>{children}</>;
  }
  
  // 繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ迥ｶ諷九′遒ｺ隱堺ｸｭ縺ｮ蝣ｴ蜷医ｂ繧｢繝励Μ繧定｡ｨ遉ｺ・医ヶ繝ｭ繝・く繝ｳ繧ｰ蝗樣∩・・  // 窶ｻ Web迺ｰ蠅・〒縺ｯlocalStorage縺九ｉ蜷梧悄蜿門ｾ励＆繧後ｋ縺溘ａnull縺ｫ縺ｪ繧九％縺ｨ縺ｯ遞
  
  // 繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ譛ｪ螳御ｺ・・蝣ｴ蜷医・繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ逕ｻ髱｢繧定｡ｨ遉ｺ
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }
  
  // 繧ｪ繝ｳ繝懊・繝・ぅ繝ｳ繧ｰ螳御ｺ・ｸ医∩縺ｮ蝣ｴ蜷医・繧｢繝励Μ繧定｡ｨ遉ｺ
  return <>{children}</>;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    const sentryTimer = setTimeout(() => { initSentry(); }, 2000);
    initManusRuntime();
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

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: createPerformanceQueryCache(),
        mutationCache: createPerformanceMutationCache(),
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // v5.36: 繧ｭ繝｣繝・す繝･譛滄俣繧貞ｻｶ髟ｷ縲ゑｼ貞屓逶ｮ莉･髯阪・陦ｨ遉ｺ繧堤椪譎ゅ↓
            // Cache data for 30 minutes (stale-while-revalidate)
            staleTime: 30 * 60 * 1000,
            // Keep cached data for 2 hours
            gcTime: 2 * 60 * 60 * 1000,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
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

  const content = (
    <ErrorBoundary screenName="App">
      <GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <EarlyPrefetch />
            <AutoLoginProvider>
              <LoginSuccessProvider>
                <TutorialProvider>
                  <ExperienceProvider>
                    <ToastProvider>
                      <OnboardingWrapper>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="(tabs)" />
                        </Stack>
                        <StatusBar style="auto" />
                        <LoginSuccessModalWrapper />
                        <OfflineBanner />
                        <NetworkToast />
                        <TutorialUI />
                        <ConditionalExperienceOverlay />
                      </OnboardingWrapper>
                    </ToastProvider>
                  </ExperienceProvider>
                </TutorialProvider>
              </LoginSuccessProvider>
            </AutoLoginProvider>
          </PersistQueryClientProvider>
        </trpc.Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        tokenCache={tokenCache}
      >
        <ClerkTokenSync />
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
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkTokenSync />
      <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
    </ClerkProvider>
  );
}




