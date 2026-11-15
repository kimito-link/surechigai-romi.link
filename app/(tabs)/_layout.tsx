/**
 * タブレイアウト — 認証済みのみ Tutorial + presence runners（ゲスト bundle から分離）
 */
import { Tabs } from "expo-router";
import { color, WEB_TAB_BAR_BOTTOM_PADDING_CSS, WEB_TAB_BAR_HEIGHT_CSS } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/atoms/haptic-tab";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { Platform, useWindowDimensions, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PostTabIcon } from "@/components/post/post-tab-icon";
import { TAB_BAR_BODY_HEIGHT } from "@/hooks/use-tab-bar-inset";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  WebSideNav,
  useWebSideNavActive,
  WEB_SIDE_NAV_WIDTH,
} from "@/components/organisms/web-side-nav";
import { WebAppFooter } from "@/components/organisms/web-app-footer";

const CheckinTabIconAuthenticated = lazy(() =>
  import("@/components/tabs/checkin-tab-icon-authenticated").then((m) => ({
    default: m.CheckinTabIconAuthenticated,
  })),
);
const TabAuthenticatedChrome = lazy(() =>
  import("@/components/tabs/tab-authenticated-chrome").then((m) => ({
    default: m.TabAuthenticatedChrome,
  })),
);

function CheckinTabIcon({ color: iconColor }: { color: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <IconSymbol size={26} name="location.fill" color={iconColor} />;
  }
  return (
    <Suspense fallback={<IconSymbol size={26} name="location.fill" color={iconColor} />}>
      <CheckinTabIconAuthenticated iconColor={iconColor} />
    </Suspense>
  );
}

function TabNav() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();
  const isWeb = Platform.OS === "web";
  const bottomPadding = isWeb ? 12 : Math.max(insets.bottom, 8);
  // ★2026-11-15 Web（ホーム画面に追加した iPhone）はホームバーの分（safe-area-inset-bottom）を
  //   CSS の env() で足す。12px 固定だとラベルがホームバーに重なって下が欠けていた。
  //   web の insets は常に 0（app/_layout.tsx）なので JS の値では取れない。
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + bottomPadding;
  const compactTabs = windowWidth < 480;

  return (
    <View style={{ flex: 1, marginLeft: sideNavActive ? WEB_SIDE_NAV_WIDTH : 0 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: color.accentPrimary,
          tabBarInactiveTintColor: color.textMuted,
          headerShown: false,
          tabBarButton: HapticTab,
          // ★2026-11-13 スマホでも名前を出す。アイコンだけだと何の画面か分からなかった（実機で確認）。
          tabBarShowLabel: true,
          tabBarAllowFontScaling: false,
          tabBarLabelStyle: {
            fontWeight: "700",
            fontSize: 11,
            // ★2026-11-15 行の高さを明示。未指定だと Web で箱が 11px になり、overflow:hidden で
            //   「現在地」「さがす」等の下側が欠けていた（計測で確認）。flexShrink: 0 でアイコンに押し縮められないようにする。
            lineHeight: 15,
            flexShrink: 0,
          },
          tabBarIconStyle: compactTabs ? { marginBottom: 0 } : undefined,
          // ★2026-11-15 maxWidth を外して5つを均等割りにした。スマホで maxWidth: 72 があると
          //   72×5=360px しか使わず、幅 390〜440px の iPhone では右側に空きができて左に偏っていた。
          tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 2 },
          sceneStyle: {
            backgroundColor: colors.background,
            flex: 1,
          },
          tabBarStyle: sideNavActive
            ? { display: "none" }
            : {
                paddingTop: compactTabs ? 6 : 8,
                paddingBottom: (isWeb ? WEB_TAB_BAR_BOTTOM_PADDING_CSS : bottomPadding) as number,
                paddingHorizontal: compactTabs ? 2 : 4,
                height: (isWeb ? WEB_TAB_BAR_HEIGHT_CSS : tabBarHeight) as number,
                backgroundColor: color.surface,
                borderTopColor: color.border,
                borderTopWidth: 1,
                ...(Platform.OS === "web"
                  ? ({
                      position: "fixed",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 100,
                    } as object)
                  : {}),
              },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "ポスト",
            tabBarAccessibilityLabel: "ポスト — 封筒とレーダー",
            tabBarIcon: ({ color: iconColor }) => <PostTabIcon color={iconColor} />,
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            lazy: true,
            title: "現在地",
            tabBarAccessibilityLabel: "現在地 — 今いる場所を記録する",
            tabBarIcon: ({ color: iconColor }) => <CheckinTabIcon color={iconColor} />,
          }}
        />
        <Tabs.Screen
          name="zukan"
          options={{
            lazy: true,
            title: "さがす",
            tabBarAccessibilityLabel: "さがす — 属性と都道府県で人を見つける",
            tabBarIcon: ({ color: iconColor }) => (
              <IconSymbol size={26} name="globe.asia.australia.fill" color={iconColor} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            lazy: true,
            title: "軌跡",
            tabBarAccessibilityLabel: "軌跡 — 足あとの地図",
            tabBarIcon: ({ color: iconColor }) => (
              <IconSymbol size={26} name="map.fill" color={iconColor} />
            ),
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            lazy: true,
            title: "マイページ",
            tabBarAccessibilityLabel: "マイページ — 設定とアカウント",
            tabBarIcon: ({ color: iconColor }) => (
              <IconSymbol size={26} name="person.crop.circle.fill" color={iconColor} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated } = useAuth();

  const chrome = (
    <>
      <WebSideNav />
      {useWebSideNavActive() ? <WebAppFooter /> : null}
    </>
  );

  const body = (
    <View style={{ flex: 1 }}>
      {chrome}
      <TabNav />
    </View>
  );

  if (!isAuthenticated) {
    return body;
  }

  return (
    <Suspense fallback={<View style={{ flex: 1 }} />}>
      <TabAuthenticatedChrome>{body}</TabAuthenticatedChrome>
    </Suspense>
  );
}
