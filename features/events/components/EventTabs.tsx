import { View, Text, StyleSheet, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";

export type EventTab = "overview" | "messages" | "map" | "ranking";

export type EventTabsProps = {
  activeTab: EventTab;
  onTabChange: (tab: EventTab) => void;
  messageCount?: number;
  participantCount?: number;
};

const TABS: { id: EventTab; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: "overview", label: "概要", icon: "info" },
  { id: "messages", label: "応援", icon: "chat" },
  { id: "map", label: "地図", icon: "map" },
  { id: "ranking", label: "ランキング", icon: "leaderboard" },
];

export function EventTabs({
  activeTab,
  onTabChange,
  messageCount = 0,
  participantCount = 0,
}: EventTabsProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badgeCount = tab.id === "messages" ? messageCount : 
                            tab.id === "ranking" ? participantCount : 0;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tab,
                isActive && styles.activeTab,
              ]}
            >
              <MaterialIcons
                name={tab.icon}
                size={20}
                color={isActive ? color.accentPrimary : color.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? color.accentPrimary : color.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Text>
                </View>
              )}
            </Button>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    borderRadius: 0,
  },
  activeTab: {
    borderBottomColor: color.accentPrimary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: color.accentPrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "bold",
  },
});
