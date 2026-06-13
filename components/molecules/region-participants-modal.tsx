import { View, Text, StyleSheet, Modal, Pressable, FlatList, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useState } from "react";
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

interface RegionParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  regionName: string;
  prefectures: string[];
  participants: Participant[];
}

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export function RegionParticipantsModal({
  visible,
  onClose,
  regionName,
  prefectures,
  participants,
}: RegionParticipantsModalProps) {
  
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);

  // 都道府県名の正規化（「県」「府」「都」「道」の有無を吸収）
  const normalize = (name: string) => {
    if (!name) return "";
    return name.replace(/(県|府|都|道)$/, "");
  };

  // 各都道府県の参加者数を計算
  const prefectureCounts: { [key: string]: number } = {};
  prefectures.forEach(pref => {
    const normalizedPref = normalize(pref);
    const count = participants.filter(p => normalize(p.prefecture || "") === normalizedPref).length;
    prefectureCounts[pref] = count;
  });

  // 選択された都道府県の参加者をフィルタリング
  const filteredParticipants = selectedPrefecture
    ? participants.filter(p => normalize(p.prefecture || "") === normalize(selectedPrefecture))
    : participants;

  const handleParticipantPress = (participant: Participant) => {
    if (participant.userId && !participant.isAnonymous) {
      triggerHaptic();
      onClose();
      navigate.toProfile(participant.userId);
    }
  };

  const handleClose = () => {
    triggerHaptic();
    setSelectedPrefecture(null);
    onClose();
  };

  const handlePrefectureSelect = (item: string, isSelected: boolean) => {
    triggerHaptic();
    setSelectedPrefecture(isSelected ? null : item);
  };

  const renderPrefectureItem = ({ item }: { item: string }) => {
    const count = prefectureCounts[item] || 0;
    const isSelected = selectedPrefecture === item;
    
    return (
      <Pressable
        onPress={() => handlePrefectureSelect(item, isSelected)}
        style={({ pressed }) => [
          styles.prefectureItem,
          isSelected && styles.prefectureItemSelected,
          count === 0 && styles.prefectureItemEmpty,
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        <Text style={[
          styles.prefectureName,
          isSelected && styles.prefectureNameSelected,
          count === 0 && styles.prefectureNameEmpty,
        ]}>
          {item}
        </Text>
        <Text style={[
          styles.prefectureCount,
          isSelected && styles.prefectureCountSelected,
          count === 0 && styles.prefectureCountEmpty,
        ]}>
          {count}人
        </Text>
      </Pressable>
    );
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
        <Text style={styles.participantPrefecture}>{item.prefecture || "未設定"}</Text>
      </View>
      <View style={styles.contributionBadge}>
        <Text style={styles.contributionText}>{item.contribution || 1}人</Text>
      </View>
    </Pressable>
  );

  const totalContribution = filteredParticipants.reduce((sum, p) => sum + (p.contribution || 1), 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.regionTitle}>{regionName}</Text>
              <Text style={styles.participantCount}>
                {selectedPrefecture 
                  ? `${selectedPrefecture}: ${filteredParticipants.length}人（計${totalContribution}人）`
                  : `${participants.length}人が参加（計${totalContribution}人）`
                }
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

          {/* 都道府県フィルター */}
          <View style={styles.prefectureFilter}>
            <FlatList
              data={prefectures}
              keyExtractor={(item) => item}
              renderItem={renderPrefectureItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prefectureList}
            />
          </View>

          {/* 参加者リスト */}
          {filteredParticipants.length > 0 ? (
            <FlatList
              data={filteredParticipants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderParticipant}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗾</Text>
              <Text style={styles.emptyText}>
                {selectedPrefecture 
                  ? `${selectedPrefecture}からの参加者はまだいません`
                  : "この地域からの参加者はまだいません"
                }
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
    maxHeight: "85%",
    minHeight: "50%",
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
  regionTitle: {
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
  prefectureFilter: {
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  prefectureList: {
    padding: 12,
    gap: 8,
  },
  prefectureItem: {
    backgroundColor: color.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  prefectureItemSelected: {
    backgroundColor: color.accentPrimary,
  },
  prefectureItemEmpty: {
    opacity: 0.5,
  },
  prefectureName: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "500",
  },
  prefectureNameSelected: {
    color: color.textWhite,
  },
  prefectureNameEmpty: {
    color: color.textSubtle,
  },
  prefectureCount: {
    color: color.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  prefectureCountSelected: {
    color: palette.white + "CC", // 80% opacity
  },
  prefectureCountEmpty: {
    color: color.textSubtle,
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
  participantPrefecture: {
    color: color.textSubtle,
    fontSize: 12,
    marginTop: 2,
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
