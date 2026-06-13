import { View, Text, StyleSheet, FlatList, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/molecules/optimized-image";

export type ParticipantVM = {
  id: number;
  name: string;
  profileImage?: string | null;
  twitterUsername?: string | null;
  region?: string | null;
  gender?: string | null;
  message?: string | null;
};

export type ParticipantsSectionProps = {
  participants: ParticipantVM[];
  totalCount: number;
  onParticipantPress?: (participant: ParticipantVM) => void;
  onViewAllPress?: () => void;
};

export function ParticipantsSection({
  participants,
  totalCount,
  onParticipantPress,
  onViewAllPress,
}: ParticipantsSectionProps) {
  const colors = useColors();

  const renderParticipant = ({ item }: { item: ParticipantVM }) => (
    <Button
      variant="ghost"
      onPress={() => onParticipantPress?.(item)}
      style={styles.participantCard}
    >
      <OptimizedAvatar
        source={{ uri: item.profileImage || undefined }}
        size={48}
        fallbackText={item.name.charAt(0)}
      />
      <View style={styles.participantInfo}>
        <Text style={[styles.participantName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.twitterUsername && (
          <Text style={styles.participantTwitter} numberOfLines={1}>
            @{item.twitterUsername}
          </Text>
        )}
        {item.region && (
          <View style={styles.regionBadge}>
            <Text style={styles.regionText}>{item.region}</Text>
          </View>
        )}
      </View>
    </Button>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="people" size={20} color={color.accentPrimary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            参加者 ({totalCount}人)
          </Text>
        </View>
        {totalCount > 10 && onViewAllPress && (
          <Button variant="ghost" size="sm" onPress={onViewAllPress}>
            <Text style={styles.viewAllText}>すべて見る</Text>
          </Button>
        )}
      </View>

      <FlatList
        data={participants.slice(0, 10)}
        renderItem={renderParticipant}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        windowSize={3}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        removeClippedSubviews={Platform.OS !== "web"}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  viewAllText: {
    color: color.accentPrimary,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  participantCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: 100,
    borderWidth: 1,
    borderColor: color.border,
  },
  participantInfo: {
    marginTop: 8,
    alignItems: "center",
  },
  participantName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  participantTwitter: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 2,
  },
  regionBadge: {
    backgroundColor: color.accentPrimary + "20",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  regionText: {
    fontSize: 12,
    color: color.accentPrimary,
  },
});
