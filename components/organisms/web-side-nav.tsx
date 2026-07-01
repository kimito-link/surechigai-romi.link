import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, palette } from "@/theme/tokens";
import { NavLivePrefecturePanel } from "@/components/molecules/nav-live-prefecture-panel";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { usePrefetchTab } from "@/hooks/use-tab-prefetch";
import type { TabPrefetchKey } from "@/lib/bootstrap/prefetch-tab-data";

export const WEB_SIDE_NAV_WIDTH = 200;
const SIDE_NAV_MIN_WIDTH = 900;

type NavItem = {
  href: Href;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  activePaths: string[];
  prefetchKey: TabPrefetchKey;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/(tabs)/zukan",
    label: "みんなの現在地",
    icon: "public",
    activePaths: ["/zukan"],
    prefetchKey: "zukan",
  },
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

function isActive(pathname: string, item: NavItem): boolean {
  return item.activePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function useWebSideNavActive(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= SIDE_NAV_MIN_WIDTH;
}

/** Web PC（≥900px）— 左サイドナビ */
export function WebSideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const prefetchTab = usePrefetchTab();
  const show = Platform.OS === "web" && width >= SIDE_NAV_MIN_WIDTH;

  if (!show) return null;

  return (
    <View style={styles.nav}>
      <BrandStamp variant="sideNav" />
      <NavLivePrefecturePanel />
      <View style={styles.navItems}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href)}
              onPressIn={() => prefetchTab(item.prefetchKey)}
              style={({ pressed, hovered }) => [
                styles.item,
                active && styles.itemActive,
                Platform.OS === "web" && (hovered as boolean) && styles.itemHover,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <MaterialIcons
                name={item.icon}
                size={20}
                color={active ? palette.kimitoBlue : color.textMuted}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <BrandStamp variant="sideNavFoot" />
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "fixed" as unknown as "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: WEB_SIDE_NAV_WIDTH,
    zIndex: 99,
    paddingTop: 16,
    paddingHorizontal: 12,
    backgroundColor: color.surface,
    borderRightWidth: 1,
    borderRightColor: color.border,
    gap: 4,
  },
  navItems: {
    flex: 1,
    gap: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: palette.kimitoBlue + "14",
  },
  itemHover: {
    backgroundColor: palette.kimitoBlue + "0A",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: color.textSecondary,
  },
  labelActive: {
    color: palette.kimitoBlue,
  },
});
