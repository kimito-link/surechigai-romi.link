import { View, Text, StyleSheet, Share, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";

export type ActionButtonsSectionProps = {
  isParticipating: boolean;
  isHost: boolean;
  challengeTitle: string;
  shareUrl: string;
  onParticipate: () => void;
  onInvite: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ActionButtonsSection({
  isParticipating,
  isHost,
  challengeTitle,
  shareUrl,
  onParticipate,
  onInvite,
  onShare,
  onEdit,
  onDelete,
}: ActionButtonsSectionProps) {
  const colors = useColors();

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `${challengeTitle}に参加しよう！\n${shareUrl}`,
        url: shareUrl,
      });
      onShare();
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleParticipate = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onParticipate();
  };

  const handleInvite = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onInvite();
  };

  return (
    <View style={styles.container}>
      {/* メインアクションボタン */}
      {!isParticipating ? (
        <Button
          variant="ghost"
          onPress={handleParticipate}
          style={styles.mainButtonWrapper}
        >
          <LinearGradient
            colors={[color.accentPrimary, color.accentAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainButton}
          >
            <MaterialIcons name="how-to-reg" size={24} color={color.textWhite} />
            <Text style={styles.mainButtonText}>参加表明する</Text>
          </LinearGradient>
        </Button>
      ) : (
        <View style={styles.participatingBadge}>
          <MaterialIcons name="check-circle" size={20} color={color.success} />
          <Text style={[styles.participatingText, { color: color.success }]}>
            参加表明済み
          </Text>
        </View>
      )}

      {/* サブアクションボタン */}
      <View style={styles.subButtons}>
        <Button
          variant="outline"
          onPress={handleInvite}
          style={[styles.subButton, { backgroundColor: color.surface }]}
        >
          <MaterialIcons name="person-add" size={20} color={color.accentPrimary} />
          <Text style={[styles.subButtonText, { color: colors.foreground }]}>
            友達を招待
          </Text>
        </Button>

        <Button
          variant="outline"
          onPress={handleShare}
          style={[styles.subButton, { backgroundColor: color.surface }]}
        >
          <MaterialIcons name="share" size={20} color={color.accentPrimary} />
          <Text style={[styles.subButtonText, { color: colors.foreground }]}>
            シェア
          </Text>
        </Button>
      </View>

      {/* 主催者用ボタン */}
      {isHost && (
        <View style={styles.hostButtons}>
          <Button
            variant="outline"
            onPress={onEdit ?? (() => {})}
            style={[styles.hostButton, { backgroundColor: color.surface }]}
          >
            <MaterialIcons name="edit" size={18} color={color.textSecondary} />
            <Text style={styles.hostButtonText}>編集</Text>
          </Button>

          <Button
            variant="destructive"
            onPress={onDelete ?? (() => {})}
            style={[styles.hostButton, { backgroundColor: color.surface }]}
          >
            <MaterialIcons name="delete" size={18} color={color.danger} />
            <Text style={[styles.hostButtonText, { color: color.danger }]}>削除</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  mainButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 0,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    width: "100%",
  },
  mainButtonText: {
    color: color.textWhite,
    fontSize: 18,
    fontWeight: "bold",
  },
  participatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.success + "20",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  participatingText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subButtons: {
    flexDirection: "row",
    gap: 12,
  },
  subButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: color.border,
  },
  subButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  hostButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  hostButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: color.border,
  },
  hostButtonText: {
    fontSize: 13,
    color: color.textSecondary,
  },
});
