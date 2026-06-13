import { View, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { Skeleton } from "@/components/atoms/skeleton-loader";
import { BlinkingLink } from "@/components/atoms/blinking-character";
import { FadeView } from "@/components/atoms/fade-view";

/**
 * マイページのスケルトンローダー
 * ログイン済みユーザーのマイページ読み込み中に表示
 */
export function MypageSkeleton() {
  return (
    <FadeView visible={true} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* キャラクターローディング */}
        <View style={styles.characterContainer}>
          <BlinkingLink
            variant="normalClosed"
            size={80}
            blinkInterval={2500}
          />
        </View>
        {/* プロフィールセクション */}
        <View style={styles.profileSection}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <View style={styles.profileInfo}>
            <Skeleton width={120} height={20} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={14} />
          </View>
        </View>

        {/* 統計カード */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={12} />
          </View>
          <View style={styles.statCard}>
            <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={12} />
          </View>
          <View style={styles.statCard}>
            <Skeleton width={40} height={32} style={{ marginBottom: 4 }} />
            <Skeleton width={60} height={12} />
          </View>
        </View>

        {/* バッジセクション */}
        <View style={styles.section}>
          <Skeleton width={100} height={18} style={{ marginBottom: 12 }} />
          <View style={styles.badgeContainer}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>
        </View>

        {/* 参加中のチャレンジセクション */}
        <View style={styles.section}>
          <Skeleton width={140} height={18} style={{ marginBottom: 12 }} />
          <ChallengeItemSkeleton />
          <ChallengeItemSkeleton />
        </View>

        {/* 作成したチャレンジセクション */}
        <View style={styles.section}>
          <Skeleton width={140} height={18} style={{ marginBottom: 12 }} />
          <ChallengeItemSkeleton />
        </View>
      </View>
    </FadeView>
  );
}

/**
 * チャレンジアイテムのスケルトン
 */
function ChallengeItemSkeleton() {
  return (
    <View style={styles.challengeItem}>
      <Skeleton width={60} height={60} borderRadius={8} />
      <View style={styles.challengeInfo}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={12} style={{ marginBottom: 6 }} />
        <View style={styles.progressContainer}>
          <Skeleton width="100%" height={6} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  characterContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: color.surface,
    borderRadius: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
  },
  challengeItem: {
    flexDirection: "row",
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  progressContainer: {
    marginTop: 4,
  },
});
