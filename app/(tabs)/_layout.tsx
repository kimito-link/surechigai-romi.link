/**
 * タブレイアウト — 認証済みのみ Tutorial + presence runners（ゲスト bundle から分離）
 */
import { Tabs } from "expo-router";
import { color } from "@/theme/tokens";
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
const EventsTabIconAuthenticated = lazy(() =>
  import("@/components/tabs/events-tab-icon-authenticated").then((m) => ({
    default: m.EventsTabIconAuthenticated,
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

function EventsTabIcon({ color: iconColor }: { color: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <IconSymbol size={26} name="calendar" color={iconColor} />;
  }
  return (
    <Suspense fallback={<IconSymbol size={26} name="calendar" color={iconColor} />}>
      <EventsTabIconAuthenticated iconColor={iconColor} />
    </Suspense>
  );
}

function TabNav() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const sideNavActive = useWebSideNavActive();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
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
          tabBarShowLabel: !compactTabs,
          tabBarAllowFontScaling: false,
          tabBarLabelStyle: {
            fontWeight: "700",
            fontSize: compactTabs ? 0 : 11,
          },
          tabBarIconStyle: compactTabs ? { marginBottom: 0 } : undefined,
          tabBarItemStyle: compactTabs
            ? { flex: 1, minWidth: 0, maxWidth: 72, paddingHorizontal: 2 }
            : { flex: 1, minWidth: 0, paddingHorizontal: 2 },
          sceneStyle: {
            backgroundColor: colors.background,
            flex: 1,
          },
          tabBarStyle: sideNavActive
            ? { display: "none" }
            : {
                paddingTop: compactTabs ? 6 : 8,
                paddingBottom: bottomPadding,
                paddingHorizontal: compactTabs ? 2 : 4,
                height: tabBarHeight,
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
            title: "チェックイン",
            tabBarAccessibilityLabel: "チェックイン — 現在地を記録",
            tabBarIcon: ({ color: iconColor }) => <CheckinTabIcon color={iconColor} />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            lazy: true,
            title: "集まり",
            tabBarAccessibilityLabel: "集まり — 予定と今ここ",
            tabBarIcon: ({ color: iconColor }) => <EventsTabIcon color={iconColor} />,
          }}
        />
        <Tabs.Screen
          name="zukan"
          options={{
            lazy: true,
            title: "現在地",
            tabBarAccessibilityLabel: "みんなの現在地 — 都道府県別",
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
