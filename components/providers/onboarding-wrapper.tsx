/**
 * オンボーディング — 起動時はブロックせず、チュートリアル後などにオーバーレイ表示
 */
import { Platform, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { OnboardingScreen } from "@/features/onboarding/components/OnboardingScreen";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";

const overlayStyle = Platform.select({
  web: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  default: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});

export function OnboardingWrapper({ children }: { children: ReactNode }) {
  const { hasCompletedOnboarding, isShowingOnboarding } = useOnboarding();

  const showOverlay = isShowingOnboarding && hasCompletedOnboarding === false;

  return (
    <>
      {children}
      {showOverlay ? (
        <View style={overlayStyle} pointerEvents="auto">
          <OnboardingScreen />
        </View>
      ) : null}
    </>
  );
}
