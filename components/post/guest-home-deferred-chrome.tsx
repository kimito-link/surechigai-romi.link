/**
 * ゲストホーム — LCP 後 idle で載せる chrome（header / logo / CTA 詳細）。
 * kimito FontLoader 思想: 初回 paint の帯域を LCP テキストに譲る。
 */
import { lazy, Suspense } from "react";
import { View, StyleSheet } from "react-native";
import type { LoginPreviewBenefit } from "@/components/molecules/login-preview-banner-extras";

const LazyAppHeader = lazy(() =>
  import("@/components/organisms/app-header").then((m) => ({ default: m.AppHeader })),
);

const LazyBrandStamp = lazy(() =>
  import("@/components/brand/brand-stamp").then((m) => ({ default: m.BrandStamp })),
);

const LazyLoginPreviewBannerExtras = lazy(() =>
  import("@/components/molecules/login-preview-banner-extras").then((m) => ({
    default: m.LoginPreviewBannerExtras,
  })),
);

export function GuestHomeDeferredHeader({ isDesktop }: { isDesktop: boolean }) {
  return (
    <Suspense fallback={<View style={styles.headerStub} />}>
      <LazyAppHeader showLoginButton isDesktop={isDesktop} showMenu />
    </Suspense>
  );
}

export function GuestHomeDeferredBody({ benefits }: { benefits: LoginPreviewBenefit[] }) {
  return (
    <>
      <Suspense fallback={null}>
        <LazyBrandStamp variant="hero" />
      </Suspense>
      <Suspense fallback={null}>
        <LazyLoginPreviewBannerExtras benefits={benefits} />
      </Suspense>
    </>
  );
}

const styles = StyleSheet.create({
  headerStub: {
    height: 56,
    backgroundColor: "#E2EDF7",
    borderBottomWidth: 1,
    borderBottomColor: "#00427B40",
  },
});
