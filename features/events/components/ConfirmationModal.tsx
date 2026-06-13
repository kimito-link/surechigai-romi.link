import { View, Text, Modal, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, palette } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import type { Companion } from "./ParticipationForm";
import { Button } from "@/components/ui/button";
import { TwitterUserCard, TwitterUserCompact, toTwitterUserData } from "@/components/molecules/twitter-user-card";
import { eventDetailCopy, commonCopy } from "@/constants/copy";

export type ConfirmationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  
  // ユーザー情報
  user: {
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
  } | null;
  
  // フォームデータ
  prefecture: string;
  companions: Companion[];
  message: string;
};

export function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  isSubmitting,
  user,
  prefecture,
  companions,
  message,
}: ConfirmationModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: color.surface }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {eventDetailCopy.section.participation}の確認
          </Text>
          <Text style={styles.subtitle}>
            以下の内容で{eventDetailCopy.section.participation}します
          </Text>

          {/* 参加者情報 */}
          {user && (
            <View style={styles.userCard}>
              <Text style={styles.cardLabel}>参加者</Text>
              <TwitterUserCard
                user={toTwitterUserData(user)}
                size="small"
                showFollowers={true}
              />
            </View>
          )}

          {/* 都道府県 */}
          {prefecture && (
            <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
              <Text style={styles.cardLabel}>都道府県</Text>
              <Text style={[styles.cardValue, { color: colors.foreground }]}>{prefecture}</Text>
            </View>
          )}

          {/* 友人 */}
          {companions.length > 0 && (
            <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
              <Text style={styles.cardLabel}>一緒に参加する友人（{companions.length}人）</Text>
              <View style={styles.companionList}>
                {companions.map((c) => (
                  <View key={c.id} style={styles.companionItem}>
                    <TwitterUserCompact
                      user={toTwitterUserData({
                        displayName: c.displayName,
                        twitterUsername: c.twitterUsername,
                        profileImage: c.profileImage,
                      })}
                      size="small"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 応援メッセージ */}
          {message && (
            <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
              <Text style={styles.cardLabel}>応援メッセージ</Text>
              <Text style={[styles.messageText, { color: colors.foreground }]}>{message}</Text>
            </View>
          )}

          {/* 貢献度 */}
          <View style={[styles.contributionCard, { backgroundColor: colors.background }]}>
            <Text style={styles.contributionLabel}>あなたの貢献</Text>
            <View style={styles.contributionValue}>
              <Text style={styles.contributionNumber}>{1 + companions.length}</Text>
              <Text style={styles.contributionUnit}>人</Text>
            </View>
          </View>

          {/* ボタン */}
          <View style={styles.actions}>
            <Button
              variant="secondary"
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>戻る</Text>
            </Button>
            <Button
              variant="ghost"
              onPress={onConfirm}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={styles.confirmButton}
            >
              <LinearGradient
                colors={[color.accentPrimary, color.accentAlt]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.confirmButtonGradient, isSubmitting && styles.confirmButtonDisabled]}
              >
                <Text style={[styles.confirmButtonText, { color: colors.foreground }]}>
                  {isSubmitting ? commonCopy.loading.submitting : eventDetailCopy.actions.participate}
                </Text>
              </LinearGradient>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.gray900 + "B3", // rgba(0,0,0,0.7) の透明度16進数
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: color.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  cardLabel: {
    color: color.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  cardValue: {
    fontSize: 16,
  },
  companionList: {
    gap: 8,
  },
  companionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageText: {
    fontSize: 14,
  },
  contributionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: color.border,
  },
  contributionLabel: {
    color: color.textSecondary,
    fontSize: 14,
  },
  contributionValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  contributionNumber: {
    color: color.accentPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  contributionUnit: {
    color: color.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    padding: 0,
  },
  confirmButtonGradient: {
    padding: 16,
    alignItems: "center",
    width: "100%",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
