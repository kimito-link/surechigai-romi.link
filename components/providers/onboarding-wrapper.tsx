/**
 * 初回オンボーディングラッパー — 未完了時のみ全画面カルーセルを表示
 */
import { usePathname } from "expo-router";
import type { ReactNode } from "react";
import { OnboardingScreen, OnboardingBootSplash } from "@/features/onboarding/components/OnboardingScreen";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { shouldSkipOnboarding } from "@/lib/onboarding/skip-routes";

export function OnboardingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();

  if (shouldSkipOnboarding(pathname)) {
    return <>{children}</>;
  }

  if (hasCompletedOnboarding === null) {
    return <OnboardingBootSplash />;
  }

  if (hasCompletedOnboarding === false) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return <>{children}</>;
}
