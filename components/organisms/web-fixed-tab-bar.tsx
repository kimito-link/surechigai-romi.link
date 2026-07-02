/**
 * タブ外ルート用の固定フッターナビ（Web）。
 * (tabs) レイアウトと同じ6タブへリンクする。
 */
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@/lib/icons/material-icons";
import { color } from "@/theme/tokens";
import { TAB_BAR_BODY_HEIGHT } from "@/hooks/use-tab-bar-inset";
import { usePrefetchTab } from "@/hooks/use-tab-prefetch";
import type { TabPrefetchKey } from "@/lib/bootstrap/prefetch-tab-data";

type TabItem = {
  href: Href;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  activePaths: string[];
  prefetchKey: TabPrefetchKey;
};

const TABS: TabItem[] = [
  {
    href: "/(tabs)",
    label: "ポスト",
    icon: "mail",
    activePaths: ["/", "/index"],
    prefetchKey: "post",
  },
  {
    href: "/(tabs)/checkin",
    label: "チェックイン",
    icon: "location-on",
    activePaths: ["/checkin"],
    prefetchKey: "checkin",
  },
  {
    href: "/(tabs)/events",
    label: "集まり",
    icon: "event",
    activePaths: ["/events"],
    prefetchKey: "events",
  },
  {
    href: "/(tabs)/zukan",
    label: "図鑑",
    icon: "menu-book",
    activePaths: ["/zukan"],
    prefetchKey: "zukan",
  },
  {
    href: "/(tabs)/map",
    label: "軌跡",
    icon: "map",
    activePaths: ["/map"],
    prefetchKey: "map",
  },
  {
    href: "/(tabs)/mypage",
    label: "マイページ",
    icon: "person",
    activePaths: ["/mypage"],
    prefetchKey: "mypage",
  },
];

function isTabActive(pathname: string, tab: TabItem): boolean {
  return tab.activePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function WebFixedTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const prefetchTab = usePrefetchTab();
  const compact = width < 480;
  const bottomPad = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  if (Platform.OS !== "web") return null;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: bottomPad,
          height: TAB_BAR_BODY_HEIGHT + bottomPad,
        },
      ]}
    >
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab);
        const tint = active ? color.accentPrimary : color.textMuted;
        return (
          <Pressable
            key={tab.label}
            onPress={() => router.push(tab.href)}
            onPressIn={() => prefetchTab(tab.prefetchKey)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <MaterialIcons name={tab.icon} size={24} color={tint} />
            {!compact ? (
              <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
                {tab.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "fixed" as unknown as "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 4,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  item: {
    flex: 1,
    minWidth: 0,
    maxWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
});
