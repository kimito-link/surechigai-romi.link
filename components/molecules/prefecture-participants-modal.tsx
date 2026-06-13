import { View, Text, StyleSheet, Modal, Pressable, FlatList, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { OptimizedAvatar } from "./optimized-image";
import * as Haptics from "expo-haptics";

interface Participant {
  id: number;
  userId: number | null;
  displayName: string;
  username: string | null;
  profileImage: string | null;
  message: string | null;
  companionCount: number;
  contribution: number;
  prefecture: string | null;
  isAnonymous: boolean;
  followersCount?: number | null;
}

interface PrefectureParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  prefectureName: string;
  participants: Participant[];
}

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export function PrefectureParticipantsModal({
  visible,
  onClose,
  prefectureName,
  participants,
}: PrefectureParticipantsModalProps) {
  

  const handleParticipantPress = (participant: Participant) => {
    if (participant.userId && !participant.isAnonymous) {
      triggerHaptic();
      onClose();
      navigate.toProfile(participant.userId);
    }
  };

  const handleClose = () => {
    triggerHaptic();
    onClose();
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <Pressable
      onPress={() => handleParticipantPress(item)}
      style={({ pressed }) => [
        styles.participantItem,
        pressed && item.userId && !item.isAnonymous ? styles.participantItemPressed : undefined,
      ]}
    >
      <OptimizedAvatar
        source={item.profileImage ? { uri: item.profileImage } : undefined}
        size={44}
        fallbackColor={color.accentPrimary}
        fallbackText={item.displayName.charAt(0)}
      />
      <View style={styles.participantInfo}>
        <View style={styles.participantNameRow}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.isAnonymous ? "匿名ユーザー" : item.displayName}
          </Text>
          {item.followersCount && item.followersCount > 0 && (
            <View style={styles.followersBadge}>
              <Text style={styles.followersText}>
                {item.followersCount >= 10000
                  ? `${(item.followersCount / 10000).toFixed(1)}万`
                  : item.followersCount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        {item.username && !item.isAnonymous && (
          <Text style={styles.participantUsername}>@{item.username}</Text>
        )}
        {item.message && (
          <Text style={styles.participantMessage} numberOfLines={2}>
            {item.message}
          </Text>
        )}
      </View>
      <View style={styles.contributionBadge}>
        <Text style={styles.contributionText}>{item.contribution || 1}人</Text>
      </View>
    </Pressable>
  );

  const totalContribution = participants.reduce((sum, p) => sum + (p.contribution || 1), 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.prefectureName}>{prefectureName}</Text>
              <Text style={styles.participantCount}>
                {participants.length}人が参加（計{totalContribution}人）
              </Text>
            </View>
            <Pressable 
              onPress={handleClose} 
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
            >
              <MaterialIcons name="close" size={24} color={color.textMuted} />
            </Pressable>
          </View>

          {/* 参加者リスト */}
          {participants.length > 0 ? (
            <FlatList
              data={participants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderParticipant}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗾</Text>
              <Text style={styles.emptyText}>
                この都道府県からの参加者はまだいません
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.black + "B3", // 70% opacity
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: "40%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  headerContent: {
    flex: 1,
  },
  prefectureName: {
    color: color.textWhite,
    fontSize: 20,
    fontWeight: "bold",
  },
  participantCount: {
    color: color.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: color.border,
  },
  listContent: {
    padding: 16,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  participantItemPressed: {
    opacity: 0.7,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantName: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  followersBadge: {
    backgroundColor: `${color.accentAlt}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: `${color.accentAlt}60`,
    flexDirection: "row",
    alignItems: "center",
  },
  followersText: {
    color: color.accentAlt,
    fontSize: 12,
    fontWeight: "bold",
  },
  participantUsername: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  participantMessage: {
    color: color.textSubtle,
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  contributionBadge: {
    backgroundColor: color.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  contributionText: {
    color: color.accentPrimary,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
});
