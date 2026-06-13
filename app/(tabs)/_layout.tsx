import { Tabs } from "expo-router";
import { color } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/atoms/haptic-tab";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useTutorial } from "@/lib/tutorial-context";
import { FanTutorialCreateTabButton, HostTutorialCreateTabButton } from "@/components/atoms/tutorial-tab-button";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const tutorial = useTutorial();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // チュートリアル中は適切なタブボタンを使用
  const getCreateTabButton = () => {
    if (!tutorial.isActive) return HapticTab;
    
    if (tutorial.userType === "fan" && tutorial.currentStepIndex === 2) {
      // ファン向けステップ3
      return FanTutorialCreateTabButton;
    }
    if (tutorial.userType === "host" && tutorial.currentStepIndex === 0) {
      // 主催者向けステップ1
      return HostTutorialCreateTabButton;
    }
    
    return HapticTab;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.hostAccentLegacy,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        // v5.36: タブ切り替え時の白い画面を防止
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "チャレンジ作成",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
          tabBarButton: getCreateTabButton(),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "統計",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: "マイページ",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
