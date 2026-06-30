/**
 * タブレイアウト
 * 君斗りんくのすれ違ひ通信 MVP: 5タブ
 * - ポスト（封筒一覧・未開封数バッジ）
 * - チェックイン
 * - 図鑑
 * - 軌跡（Web のみ表示。Native でも tab は残すが label は隠す）
 * - マイページ
 */

import { Tabs } from "expo-router";
import { color } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/atoms/haptic-tab";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { Platform, useWindowDimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PostTabIcon } from "@/components/post/post-tab-icon";
import { TAB_BAR_BODY_HEIGHT } from "@/hooks/use-tab-bar-inset";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + bottomPadding;
  // 6タブは狭い画面でラベル付きだと右端が切れる。アイコンのみに切り替える。
  const compactTabs = windowWidth < 480;

  return (
    <Tabs
      screenOptions={{
        // kimito.link ブランド統一: アクティブ=ネイビー / 非アクティブ=slate-500 / 白基調のバー
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
        tabBarStyle: {
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
      {/* ポスト（封筒一覧） */}
      <Tabs.Screen
        name="index"
        options={{
          title: "ポスト",
          tabBarAccessibilityLabel: "ポスト",
          tabBarIcon: ({ color: iconColor }) => <PostTabIcon color={iconColor} />,
        }}
      />

      {/* チェックイン — 初回フォーカスまで chunk defer */}
      <Tabs.Screen
        name="checkin"
        options={{
          lazy: true,
          title: "チェックイン",
          tabBarAccessibilityLabel: "チェックイン",
          tabBarIcon: ({ color: iconColor }) => (
            <IconSymbol size={26} name="location.fill" color={iconColor} />
          ),
        }}
      />

      {/* 集まり（予定×今ここにいるよ） */}
      <Tabs.Screen
        name="events"
        options={{
          lazy: true,
          title: "集まり",
          tabBarAccessibilityLabel: "集まり",
          tabBarIcon: ({ color: iconColor }) => (
            <IconSymbol size={26} name="calendar" color={iconColor} />
          ),
        }}
      />

      {/* 図鑑 */}
      <Tabs.Screen
        name="zukan"
        options={{
          lazy: true,
          title: "図鑑",
          tabBarAccessibilityLabel: "図鑑",
          tabBarIcon: ({ color: iconColor }) => (
            <IconSymbol size={26} name="book.fill" color={iconColor} />
          ),
        }}
      />

      {/* 軌跡 */}
      <Tabs.Screen
        name="map"
        options={{
          lazy: true,
          title: "軌跡",
          tabBarAccessibilityLabel: "軌跡",
          tabBarIcon: ({ color: iconColor }) => (
            <IconSymbol size={26} name="map.fill" color={iconColor} />
          ),
        }}
      />

      {/* マイページ */}
      <Tabs.Screen
        name="mypage"
        options={{
          lazy: true,
          title: "マイページ",
          tabBarAccessibilityLabel: "マイページ",
          tabBarIcon: ({ color: iconColor }) => (
            <IconSymbol size={26} name="person.crop.circle.fill" color={iconColor} />
          ),
        }}
      />
    </Tabs>
  );
}
