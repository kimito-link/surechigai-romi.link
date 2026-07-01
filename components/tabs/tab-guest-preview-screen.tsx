import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { lazy, Suspense } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { palette } from "@/theme/tokens";

const LazyAppHeader = lazy(() =>
  import("@/components/organisms/app-header").then((m) => ({ default: m.AppHeader })),
);

const LazyLoginPreviewBanner = lazy(() =>
  import("@/components/molecules/login-preview-banner").then((m) => ({
    default: m.LoginPreviewBanner,
  })),
);

type Benefit = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

type TabGuestPreviewScreenProps = {
  title: string;
  headline: string;
  benefits: Benefit[];
  children?: React.ReactNode;
};

/** 未ログインタブ向け — 地図/tRPC chunk を読まないプレビュー。 */
export function TabGuestPreviewScreen({
  title,
  headline,
  benefits,
  children,
}: TabGuestPreviewScreenProps) {
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const tabInset = useTabBarInset();

  return (
    <ScreenContainer containerClassName="bg-background">
      <Suspense fallback={<View style={styles.headerStub} />}>
        <LazyAppHeader
          title={title}
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          showLoginButton
        />
      </Suspense>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Suspense fallback={null}>
          <LazyLoginPreviewBanner headline={headline} benefits={benefits} />
        </Suspense>
        {children}
        <BrandStamp variant="hero" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerStub: {
    height: 56,
    backgroundColor: "#E2EDF7",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
});
