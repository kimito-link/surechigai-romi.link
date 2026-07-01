/**
 * 未ログインタブ向け — 地図/tRPC chunk を読まないプレビュー。
 */
import { View, ScrollView, StyleSheet } from "react-native";
import { lazy, Suspense } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";

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
  const tabInset = useTabBarInset();

  return (
    <ScreenContainer containerClassName="bg-background">
      <TabScreenHeader
        title={title}
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
        showLoginButton
      />
      <ScrollView
        style={styles.scrollView}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
});
