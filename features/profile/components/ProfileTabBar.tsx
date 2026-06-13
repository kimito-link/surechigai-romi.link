/**
 * features/profile/components/ProfileTabBar.tsx
 * プロフィール画面のタブバー（参加履歴 / バッジ）
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

export type ProfileTab = "challenges" | "badges";

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "challenges", label: "参加履歴" },
  { id: "badges", label: "バッジ" },
];

export const ProfileTabBar = ({ activeTab, onTabChange }: ProfileTabBarProps) => {
  const colors = useColors();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, borderBottomColor: color.border }]}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[
              styles.tab,
              { borderBottomColor: isActive ? color.hostAccentLegacy : "transparent" },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? color.hostAccentLegacy : color.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
  },
});
