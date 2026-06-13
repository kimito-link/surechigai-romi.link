/**
 * RoleSection Component
 * ファン/主催者の役割を明確に表示するセクション
 * 
 * 2つの役割でできることを分かりやすく説明し、
 * それぞれの管理ボタンを配置
 */

import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { mypageFont } from "../../ui/theme/tokens";
import { navigate } from "@/lib/navigation";

interface RoleSectionProps {
  // ファンとしての統計
  participationsCount: number;
  totalContribution: number;
  // 主催者としての統計
  challengesCount: number;
  // 管理者かどうか
  isAdmin?: boolean;
}

export function RoleSection({
  participationsCount,
  totalContribution,
  challengesCount,
  isAdmin = false,
}: RoleSectionProps) {
  const colors = useColors();

  const handleHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNavigateToHome = () => {
    handleHaptic();
    navigate.toHome();
  };

  const handleNavigateToCreate = () => {
    handleHaptic();
    navigate.toCreateTab();
  };

  const handleNavigateToAdmin = () => {
    handleHaptic();
    navigate.toAdmin();
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        あなたの役割
      </Text>
      <Text style={[styles.sectionDescription, { color: colors.muted }]}>
        1つのアカウントで「ファン」と「主催者」の両方の機能が使えます
      </Text>

      {/* ファンとしての役割 */}
      <View style={[styles.roleCard, { backgroundColor: color.surface, borderColor: color.border }]}>
        <View style={styles.roleHeader}>
          <View style={[styles.roleIconContainer, { backgroundColor: `${color.accentAlt}20` }]}>
            <MaterialIcons name="favorite" size={24} color={color.accentAlt} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>
              ファンとして
            </Text>
            <Text style={[styles.roleSubtitle, { color: colors.muted }]}>
              推しのチャレンジを応援しよう
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: color.accentAlt }]}>
              {participationsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              参加中
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: color.accentAlt }]}>
              {totalContribution}人
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              総貢献度
            </Text>
          </View>
        </View>

        <View style={styles.featureList}>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ チャレンジに参加表明
          </Text>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ 応援メッセージを送る
          </Text>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ 友人を誘って貢献度UP
          </Text>
        </View>

        <Pressable
          onPress={handleNavigateToHome}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: `${color.accentAlt}15`, borderColor: color.accentAlt },
            pressed && styles.actionButtonPressed,
          ]}
        >
          <MaterialIcons name="search" size={18} color={color.accentAlt} />
          <Text style={[styles.actionButtonText, { color: color.accentAlt }]}>
            チャレンジを探す
          </Text>
        </Pressable>
      </View>

      {/* 主催者としての役割 */}
      <View style={[styles.roleCard, { backgroundColor: color.surface, borderColor: color.border }]}>
        <View style={styles.roleHeader}>
          <View style={[styles.roleIconContainer, { backgroundColor: `${color.hostAccentLegacy}20` }]}>
            <MaterialIcons name="campaign" size={24} color={color.hostAccentLegacy} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>
              主催者として
            </Text>
            <Text style={[styles.roleSubtitle, { color: colors.muted }]}>
              ファンを動員してイベントを盛り上げよう
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: color.hostAccentLegacy }]}>
              {challengesCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              主催中
            </Text>
          </View>
        </View>

        <View style={styles.featureList}>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ チャレンジを作成・管理
          </Text>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ 参加者の統計を確認
          </Text>
          <Text style={[styles.featureItem, { color: colors.muted }]}>
            ✓ 応援コメントをピックアップ
          </Text>
        </View>

        <Pressable
          onPress={handleNavigateToCreate}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: `${color.hostAccentLegacy}15`, borderColor: color.hostAccentLegacy },
            pressed && styles.actionButtonPressed,
          ]}
        >
          <MaterialIcons name="add-circle-outline" size={18} color={color.hostAccentLegacy} />
          <Text style={[styles.actionButtonText, { color: color.hostAccentLegacy }]}>
            チャレンジを作成
          </Text>
        </Pressable>
      </View>

      {/* 運営管理者（Adminのみ表示） */}
      {isAdmin && (
        <View style={[styles.roleCard, styles.adminCard, { backgroundColor: color.surface, borderColor: color.rankGold }]}>
          <View style={styles.roleHeader}>
            <View style={[styles.roleIconContainer, { backgroundColor: `${color.rankGold}20` }]}>
              <MaterialIcons name="admin-panel-settings" size={24} color={color.rankGold} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleTitle, { color: colors.foreground }]}>
                運営管理者
              </Text>
              <Text style={[styles.roleSubtitle, { color: colors.muted }]}>
                サイト全体を管理
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleNavigateToAdmin}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: `${color.rankGold}15`, borderColor: color.rankGold },
              pressed && styles.actionButtonPressed,
            ]}
          >
            <MaterialIcons name="dashboard" size={18} color={color.rankGold} />
            <Text style={[styles.actionButtonText, { color: color.rankGold }]}>
              管理ダッシュボード
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: mypageFont.lg,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: mypageFont.meta,
    marginBottom: 16,
  },
  roleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  adminCard: {
    borderWidth: 2,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: mypageFont.title,
    fontWeight: "bold",
  },
  roleSubtitle: {
    fontSize: mypageFont.meta,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: mypageFont.lg,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: mypageFont.meta,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 16,
  },
  featureList: {
    marginBottom: 12,
  },
  featureItem: {
    fontSize: mypageFont.meta,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: mypageFont.body,
    fontWeight: "600",
  },
});
