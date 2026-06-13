/**
 * v5.38: ファンプロフィールモーダル（推し活状況）
 * 
 * ファンをクリックした時に表示されるプロフィール情報と推し活状況モーダル
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
  ScrollView,
} from "react-native";
import { openTwitterProfile } from "@/lib/navigation";
import { Image } from "expo-image";
import { RetryButton } from "@/components/ui/retry-button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { getProfile, type TwitterProfile } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface FanProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: number;
  twitterId?: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

interface RecentChallenge {
  id: number;
  title: string;
  targetName: string;
  participatedAt: string;
}


export function FanProfileModal({
  visible,
  onClose,
  userId,
  twitterId,
  username,
  displayName,
  profileImage,
}: FanProfileModalProps) {
  const colors = useColors();
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 推し活状況を取得
  const { data: oshikatsuData, isLoading: oshikatsuLoading } = (trpc.profiles as any).getOshikatsuStats.useQuery(
    { userId: userId!, twitterId: twitterId },
    { enabled: visible && (!!userId || !!twitterId) }
  );

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
    if (!username) return;
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
  const name = profile?.name || displayName || username || "ユーザー";
  const image = profile?.profileImage || profileImage;
  const description = profile?.description || "";
  const followersCount = profile?.followersCount || 0;

  const isLoading = loading || oshikatsuLoading;

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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
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
                </View>

                {/* 名前とユーザー名 */}
                <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
                {username && (
                  <Text style={[styles.username, { color: colors.muted }]}>@{username}</Text>
                )}

                {/* 説明文 */}
                {description ? (
                  <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={3}>
                    {description}
                  </Text>
                ) : null}

                {/* フォロワー数 */}
                {followersCount > 0 && (
                  <View style={styles.followersContainer}>
                    <MaterialIcons name="people" size={16} color={color.accentAlt} />
                    <Text style={styles.followersValue}>
                      {followersCount.toLocaleString()}
                    </Text>
                    <Text style={styles.followersLabel}>フォロワー</Text>
                  </View>
                )}

                {/* 推し活状況セクション */}
                <View style={[styles.oshikatsuSection, { borderTopColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="favorite" size={20} color={colors.secondary} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>推し活状況</Text>
                  </View>

                  {oshikatsuData ? (
                    <>
                      {/* 統計情報 */}
                      <View style={styles.oshikatsuStats}>
                        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                          <Text style={[styles.statCardValue, { color: colors.primary }]}>
                            {oshikatsuData.totalParticipations}
                          </Text>
                          <Text style={[styles.statCardLabel, { color: colors.muted }]}>参加回数</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                          <Text style={[styles.statCardValue, { color: colors.secondary }]}>
                            {oshikatsuData.totalContribution}
                          </Text>
                          <Text style={[styles.statCardLabel, { color: colors.muted }]}>貢献ポイント</Text>
                        </View>
                      </View>

                      {/* 最近の参加チャレンジ */}
                      {oshikatsuData.recentChallenges && oshikatsuData.recentChallenges.length > 0 && (
                        <View style={styles.recentChallenges}>
                          <Text style={[styles.recentTitle, { color: colors.muted }]}>最近の参加</Text>
                          {oshikatsuData.recentChallenges.slice(0, 3).map((challenge: RecentChallenge) => (
                            <View
                              key={challenge.id}
                              style={[styles.challengeItem, { borderBottomColor: colors.border }]}
                            >
                              <View style={styles.challengeInfo}>
                                <Text style={[styles.challengeTitle, { color: colors.foreground }]} numberOfLines={1}>
                                  {challenge.title}
                                </Text>
                                <Text style={[styles.challengeTarget, { color: colors.muted }]} numberOfLines={1}>
                                  {challenge.targetName}
                                </Text>
                              </View>
                              <Text style={[styles.challengeDate, { color: colors.muted }]}>
                                {new Date(challenge.participatedAt).toLocaleDateString("ja-JP", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={[styles.noDataText, { color: colors.muted }]}>
                        まだ推し活データがありません
                      </Text>
                    </View>
                  )}
                </View>

                {/* Twitterで見るボタン */}
                {username && (
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
                )}
              </>
            )}
          </ScrollView>
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
    maxHeight: "80%",
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
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
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  followersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
    backgroundColor: `${color.accentAlt}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${color.accentAlt}60`,
    alignSelf: "center",
  },
  followersValue: {
    fontSize: 16,
    fontWeight: "700",
    color: color.accentAlt,
  },
  followersLabel: {
    fontSize: 12,
    color: color.accentAlt,
  },
  oshikatsuSection: {
    width: "100%",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  oshikatsuStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statCardLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  recentChallenges: {
    width: "100%",
  },
  recentTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  challengeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  challengeTarget: {
    fontSize: 12,
    marginTop: 2,
  },
  challengeDate: {
    fontSize: 12,
  },
  noDataContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 13,
  },
  twitterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 8,
    width: "100%",
  },
  twitterButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "600",
  },
});
