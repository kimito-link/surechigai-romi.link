import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Skeleton } from "@/components/atoms/skeleton-loader";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { FadeView } from "@/components/atoms/fade-view";

const { width: screenWidth } = Dimensions.get("window");

/**
 * イベント詳細画面用のスケルトンローダー
 */
export function EventDetailSkeleton() {
  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader title="" />
      <FadeView visible={true} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, backgroundColor: color.bg }}>
          {/* ヘッダー画像エリア */}
          <View style={styles.headerArea}>
            <Skeleton width={screenWidth} height={200} borderRadius={0} />
            
            {/* オーバーレイ情報 */}
            <View style={styles.headerOverlay}>
              <View style={styles.headerContent}>
                {/* タイトル */}
                <Skeleton width="80%" height={28} borderRadius={4} />
                <View style={{ height: 8 }} />
                <Skeleton width="60%" height={20} borderRadius={4} />
                
                {/* 日付・場所 */}
                <View style={{ height: 16 }} />
                <View style={styles.row}>
                  <Skeleton width={20} height={20} borderRadius={10} />
                  <View style={{ width: 8 }} />
                  <Skeleton width={120} height={16} borderRadius={4} />
                </View>
                <View style={{ height: 8 }} />
                <View style={styles.row}>
                  <Skeleton width={20} height={20} borderRadius={10} />
                  <View style={{ width: 8 }} />
                  <Skeleton width={100} height={16} borderRadius={4} />
                </View>
              </View>
            </View>
          </View>

          {/* 進捗セクション */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <Skeleton width="40%" height={24} borderRadius={4} />
              <View style={{ height: 12 }} />
              <Skeleton width="100%" height={12} borderRadius={6} />
              <View style={{ height: 8 }} />
              <View style={styles.row}>
                <Skeleton width={80} height={36} borderRadius={4} />
                <Skeleton width={60} height={20} borderRadius={4} />
              </View>
            </View>
          </View>

          {/* カウントダウン */}
          <View style={styles.section}>
            <Skeleton width="100%" height={80} borderRadius={12} />
          </View>

          {/* アクションボタン */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Skeleton width="48%" height={44} borderRadius={22} />
              <Skeleton width="48%" height={44} borderRadius={22} />
            </View>
          </View>

          {/* 参加表明セクション */}
          <View style={styles.section}>
            <Skeleton width={120} height={24} borderRadius={4} />
            <View style={{ height: 16 }} />
            
            {/* 参加表明フォーム */}
            <View style={styles.formCard}>
              <Skeleton width="100%" height={16} borderRadius={4} />
              <View style={{ height: 12 }} />
              <Skeleton width="100%" height={44} borderRadius={8} />
              <View style={{ height: 16 }} />
              <Skeleton width="100%" height={16} borderRadius={4} />
              <View style={{ height: 12 }} />
              <Skeleton width="100%" height={100} borderRadius={8} />
              <View style={{ height: 16 }} />
              <Skeleton width="100%" height={48} borderRadius={24} />
            </View>
          </View>

          {/* 参加者一覧 */}
          <View style={styles.section}>
            <Skeleton width={100} height={24} borderRadius={4} />
            <View style={{ height: 16 }} />
            
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.participantCard}>
                <View style={styles.row}>
                  <Skeleton width={48} height={48} borderRadius={24} />
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="60%" height={18} borderRadius={4} />
                    <View style={{ height: 4 }} />
                    <Skeleton width="40%" height={14} borderRadius={4} />
                  </View>
                  <Skeleton width={40} height={24} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </FadeView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    position: "relative",
  },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: palette.black + "80",
  },
  headerContent: {
    gap: 4,
  },
  section: {
    padding: 16,
  },
  progressCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
  },
  formCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
  },
  participantCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
