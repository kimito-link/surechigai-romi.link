/**
 * v5.38: 主催者プロフィールモーダル
 * 
 * 主催者をクリックした時に表示されるプロフィール情報モーダル
 */

import { useEffect, useState, useCallback } from "react";
import { color, palette } from "@/theme/tokens";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { openTwitterProfile } from "@/lib/navigation";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RetryButton } from "@/components/ui/retry-button";
import * as Haptics from "expo-haptics";
import { getProfile, type TwitterProfile } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";

interface HostProfileModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  profileImage?: string;
  challengeCount?: number;
}

export function HostProfileModal({
  visible,
  onClose,
  username,
  displayName,
  profileImage,
  challengeCount,
}: HostProfileModalProps) {
  const colors = useColors();
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(username);
      setProfile(data);
    } catch {
      setError("プロフィールの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (visible && username) {
      loadProfile();
    }
  }, [visible, username, loadProfile]);

  const handleOpenTwitter = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    openTwitterProfile(username);
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  // 表示用のデータ（APIデータ優先、なければprops）
  const name = profile?.name || displayName || username;
  const image = profile?.profileImage || profileImage;
  const description = profile?.description || "";
  const followersCount = profile?.followersCount || 0;
  const followingCount = profile?.followingCount || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.container, { backgroundColor: colors.surface }]}
        >
          {/* 閉じるボタン */}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleClose}
          >
            <MaterialIcons name="close" size={24} color={colors.muted} />
          </Pressable>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                プロフィールを読み込み中...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <View style={styles.retryButtonContainer}>
                <RetryButton onPress={loadProfile} variant="retry" />
              </View>
            </View>
          ) : (
            <>
              {/* プロフィール画像 */}
              <View style={styles.imageContainer}>
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={styles.profileImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: colors.border }]}>
                    <MaterialIcons name="person" size={48} color={colors.muted} />
                  </View>
                )}
                {/* 主催者バッジ */}
                <View style={[styles.hostBadge, { backgroundColor: colors.secondary }]}>
                  <MaterialIcons name="star" size={14} color={color.textWhite} />
                  <Text style={styles.hostBadgeText}>主催者</Text>
                </View>
              </View>

              {/* 名前とユーザー名 */}
              <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
              <Text style={[styles.username, { color: colors.muted }]}>@{username}</Text>

              {/* 説明文 */}
              {description ? (
                <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={3}>
                  {description}
                </Text>
              ) : null}

              {/* 統計情報 */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {followersCount.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>フォロワー</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {followingCount.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>フォロー中</Text>
                </View>
                {challengeCount !== undefined && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.foreground }]}>
                        {challengeCount}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>チャレンジ</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Twitterで見るボタン */}
              <Pressable
                style={({ pressed }) => [
                  styles.twitterButton,
                  { backgroundColor: color.twitter },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={handleOpenTwitter}
              >
                <MaterialIcons name="open-in-new" size={18} color={color.textWhite} />
                <Text style={styles.twitterButtonText}>Xで見る</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.gray900 + "99", // 60% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  retryButtonContainer: {
    marginTop: 16,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  hostBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  hostBadgeText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 16,
    width: "100%",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  twitterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
    width: "100%",
  },
  twitterButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
  },
});
