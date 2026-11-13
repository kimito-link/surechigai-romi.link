/**
 * 左上ブランド領域 — ロゴ＋アプリ名をタップでポスト（ホーム）へ。
 * Web の慣習（左上クリック＝TOP）に合わせる。
 */
import type { ReactNode } from "react";
import { Pressable, View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import {
  KIMITO_LINK_MARK,
  KIMITO_LINK_MARK_ASPECT,
  PRODUCT_NAME,
  PRODUCT_SUBTITLE,
  PARENT_BRAND,
} from "@/components/brand/brand-constants";
import { navigate } from "@/lib/navigation";
import { triggerHomeScroll } from "@/lib/home-scroll";
import { palette } from "@/theme/tokens";

const DISPLAY_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const MARK_HEIGHT = 34;

export type BrandHomeLinkProps = {
  title?: string;
  isDesktop?: boolean;
  isNarrow?: boolean;
  /** タブ画面用 — 小さめアイコン、画面名のみ、バージョン非表示 */
  compact?: boolean;
  /** 旧: ワードマークの出し分け。2026-11-13 にロゴへ一本化したので今は使わない（呼び出し側の互換のため残す） */
  hideWordmark?: boolean;
  singleLine?: boolean;
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
  compact = false,
}: BrandHomeLinkProps) {
  const markHeight = compact ? 30 : MARK_HEIGHT;
  const titleSize = compact ? 14 : isDesktop ? 17 : 15;
  const versionSize = isDesktop ? 12 : 11;
  // ★2026-11-13 左上は kimito.link 本体・Voice と同じ「Kimito Link」ロゴ＋「すれ違ひ通信」。
  //   以前は丸いアプリアイコン＋「君斗りんくのすれ違ひ通信」で、姉妹サービスに見えなかった。
  const shownTitle = title === PRODUCT_NAME ? PRODUCT_SUBTITLE : title;

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
      {/* expo-image の Web 実装では、通常表示の経路が accessibilityLabel しか
          見ておらず（ExpoImage.web.tsx の ImageWrapper 呼び出し）、alt prop は
          プレースホルダー経路にしか効かない。alt を渡しても <img> に出ないので
          accessibilityLabel を使う（axe: image-alt）。空文字も falsy で消える。 */}
      <Image
        source={KIMITO_LINK_MARK}
        accessibilityLabel={PARENT_BRAND}
        style={{ width: Math.round(markHeight * KIMITO_LINK_MARK_ASPECT), height: markHeight, flexShrink: 0 }}
        contentFit="contain"
      />
      <View style={styles.divider} />
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, { fontSize: titleSize }]}
          numberOfLines={1}
          accessibilityLabel={PRODUCT_NAME}
        >
          {shownTitle}
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
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: -4,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 2,
    // ホームへ戻る主要導線。compact(アイコン28px)だと実測 80x32px しか無く
    // Apple HIG の 44px を下回っていた（2026-08-19 本番実測・375px幅）。
    minHeight: 44,
    borderRadius: 8,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
  hitAreaHover: {
    backgroundColor: "rgba(0, 66, 123, 0.06)",
  },
  hitAreaPressed: {
    opacity: 0.88,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(0,66,123,0.2)",
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    color: palette.kimitoBlue,
    fontWeight: "800",
    letterSpacing: 0,
    flexShrink: 1,
  },
  version: {
    color: palette.kimitoBlue,
    // 0.72 だと実効色が #3f729e になりカード地 #E2EDF7 で 4.30＝AA 未達だった。
    // 0.8 で 5.26。色自体（#00427B）は十分濃く、薄めすぎが原因。
    opacity: 0.8,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  taglineHit: {
    alignSelf: "flex-start",
    marginLeft: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    // タグライン行もホームへ飛ぶ押下要素。実測 142x22px で HIG 下限を割っていた。
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 6,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : null),
  },
});
