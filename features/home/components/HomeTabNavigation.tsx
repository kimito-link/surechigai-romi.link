/**
 * HomeTabNavigation - ホーム画面のタブナビゲーション
 * 総合/ソロ/グループ/お気に入りのタブ切り替え
 */
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { homeText, homeUI, homeFont } from "@/features/home/ui/theme/tokens";

export type HomeTabType = "all" | "solo" | "group" | "favorite";

interface TabConfig {
  id: HomeTabType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  emoji: string;
}

const TABS: TabConfig[] = [
  { id: "all", label: "総合", icon: "emoji-events", emoji: "🏆" },
  { id: "solo", label: "ソロ", icon: "person", emoji: "👤" },
  { id: "group", label: "グループ", icon: "groups", emoji: "👥" },
  { id: "favorite", label: "お気に入り", icon: "star", emoji: "⭐" },
];

interface HomeTabNavigationProps {
  activeTab: HomeTabType;
  onTabChange: (tab: HomeTabType) => void;
  counts?: {
    all: number;
    solo: number;
    group: number;
    favorite: number;
  };
}

export function HomeTabNavigation({ 
  activeTab, 
  onTabChange,
  counts,
}: HomeTabNavigationProps) {
  const colors = useColors();

  const handleTabPress = (tab: HomeTabType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];
          
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                isActive && { backgroundColor: homeText.accent + "15", borderColor: homeText.accent },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text 
                style={[
                  styles.tabLabel, 
                  { color: isActive ? homeText.accent : colors.muted }
                ]}
              >
                {tab.label}
              </Text>
              {count !== undefined && count > 0 && (
                <View style={[styles.countBadge, isActive && { backgroundColor: homeText.accent }]}>
                  <Text style={[styles.countText, isActive && { color: "#fff" }]}>
                    {count > 99 ? "99+" : count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: homeUI.border,
    backgroundColor: "transparent",
    gap: 6,
  },
  tabActive: {
    borderWidth: 2,
  },
  tabEmoji: {
    fontSize: homeFont.title,
  },
  tabLabel: {
    fontSize: homeFont.body,
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: homeUI.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  countText: {
    fontSize: homeFont.meta,
    fontWeight: "bold",
    color: homeText.muted,
  },
});
