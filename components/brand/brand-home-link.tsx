/**
 * 左上ブランド領域 — ロゴ＋アプリ名をタップでポスト（ホーム）へ。
 * Web の慣習（左上クリック＝TOP）に合わせる。
 */
import type { ReactNode } from "react";
import { Pressable, View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { APP_BRAND_ICON } from "@/components/brand/app-brand-icon";
import { KIMITO_LINK_LOGO } from "@/components/brand/brand-constants";
import { navigate } from "@/lib/navigation";
import { triggerHomeScroll } from "@/lib/home-scroll";
import { palette } from "@/theme/tokens";

const DISPLAY_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const ICON_SIZE = 36;

export type BrandHomeLinkProps = {
  title?: string;
  isDesktop?: boolean;
  isNarrow?: boolean;
  /** タブ画面用 — 小さめアイコン、画面名のみ、バージョン非表示 */
  compact?: boolean;
};

function goHome() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  navigate.toHome();
  requestAnimationFrame(() => triggerHomeScroll());
}

export function BrandHomeLink({
  title = "君斗りんくのすれ違ひ通信",
  isDesktop = false,
  isNarrow = false,
  compact = false,
}: BrandHomeLinkProps) {
  const iconSize = compact ? 28 : ICON_SIZE;
  const titleSize = compact ? 16 : isDesktop ? 18 : isNarrow ? 14 : 15;
  const versionSize = isDesktop ? 12 : 11;

  return (
    <Pressable
      onPress={goHome}
      accessibilityRole="link"
      accessibilityLabel="ホーム — ポスト画面へ"
      style={({ pressed, hovered }) => [
        styles.hitArea,
        Platform.OS === "web" && (hovered as boolean) && styles.hitAreaHover,
        pressed && styles.hitAreaPressed,
      ]}
    >
      <Image
        source={APP_BRAND_ICON}
        style={[styles.icon, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}
        contentFit="cover"
      />
      <View style={styles.textBlock}>
        {!compact ? (
          <Image source={KIMITO_LINK_LOGO} style={styles.wordmark} contentFit="contain" />
        ) : null}
        <View style={compact || isNarrow ? styles.titleCol : styles.titleRow}>
          <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={compact ? 1 : isNarrow ? 2 : 1}>
            {title}
          </Text>
          {!compact ? (
            <Text
              style={[styles.version, { fontSize: versionSize }]}
              accessibilityLabel={`バージョン ${DISPLAY_VERSION}`}
            >
              v{DISPLAY_VERSION}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/** タグライン行もホームへ（任意で AppHeader から利用） */
export function BrandHomeTaglineLink({ children }: { children: ReactNode }) {
  return (
    <Pressable
      onPress={goHome}
      accessibilityRole="link"
      accessibilityLabel="ホーム — ポスト画面へ"
      style={({ pressed, hovered }) => [
        styles.taglineHit,
        Platform.OS === "web" && (hovered as boolean) && styles.hitAreaHover,
        pressed && styles.hitAreaPressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: -4,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 2,
    borderRadius: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  hitAreaHover: {
    backgroundColor: "rgba(0, 66, 123, 0.06)",
  },
  hitAreaPressed: {
    opacity: 0.88,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    flexShrink: 0,
  },
  textBlock: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  titleCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  wordmark: {
    width: 88,
    height: 22,
    marginBottom: 2,
    flexShrink: 0,
  },
  title: {
    color: palette.kimitoBlue,
    fontWeight: "800",
    letterSpacing: 0,
    flexShrink: 1,
  },
  version: {
    color: palette.kimitoBlue,
    opacity: 0.72,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  taglineHit: {
    alignSelf: "flex-start",
    marginLeft: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
});
