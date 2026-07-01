/**
 * ゲストホーム — LCP 確定後 idle で載せる benefits（MaterialIcons font 含む）。
 */
import { lazy, Suspense } from "react";
import { View, StyleSheet } from "react-native";
import type { LoginPreviewBenefit } from "@/components/molecules/login-preview-banner-extras";

const LazyLoginPreviewBannerExtras = lazy(() =>
  import("@/components/molecules/login-preview-banner-extras").then((m) => ({
    default: m.LoginPreviewBannerBenefitsOnly,
  })),
);

/** benefits 5 行分 — 遅延 mount 時の CLS 抑制 */
export const GUEST_HOME_BENEFITS_PLACEHOLDER_HEIGHT = 196;

export function GuestHomeDeferredBenefits({ benefits }: { benefits: LoginPreviewBenefit[] }) {
  return (
    <Suspense
      fallback={<View style={styles.placeholder} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
    >
      <LazyLoginPreviewBannerExtras benefits={benefits} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: GUEST_HOME_BENEFITS_PLACEHOLDER_HEIGHT,
    width: "100%",
  },
});
