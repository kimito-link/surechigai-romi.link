/**
 * ランキング画面
 * 貢献度・主催者のランキングを表示
 */

import { FlatList, Pressable, RefreshControl, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { navigateBack } from "@/lib/navigation/app-routes";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { usePerformanceMonitor } from "@/lib/performance-monitor";
import {
  RankingTabs,
  PeriodFilter,
  MyPositionCard,
  RankingRow,
  RankingEmptyState,
  RankingHeader,
  RankingLoadingState,
  useRankingsData,
  type RankingItem,
} from "@/features/rankings";

export default function RankingsScreen() {
  const { user, isAuthReady } = useAuth();
  const rankingsData = useRankingsData();
  
  // Performance monitoring
  usePerformanceMonitor(
    "Rankings",
    rankingsData.hasData,
    rankingsData.isInitialLoading,
    !rankingsData.hasData
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* 更新中インジケータ */}
      <RefreshingIndicator isRefreshing={rankingsData.isRefreshing} />
      
      {/* ヘッダー */}
      <AppHeader 
        title="君斗りんくの動員ちゃれんじ" 
        showCharacters={false}
        rightElement={
          <Pressable
            onPress={() => navigateBack()}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <MaterialIcons name="arrow-back" size={24} color={color.textWhite} />
          </Pressable>
        }
      />
      
      <RankingHeader tab={rankingsData.tab} />
      <RankingTabs tab={rankingsData.tab} onTabChange={rankingsData.setTab} />

      {/* 期間フィルター（貢献度タブのみ） */}
      {rankingsData.tab === "contribution" && (
        <PeriodFilter period={rankingsData.period} onPeriodChange={rankingsData.setPeriod} />
      )}

      {/* 自分の順位（認証確定後のみで点滅防止） */}
      {isAuthReady && user && rankingsData.myPosition && rankingsData.tab === "contribution" && (
        <MyPositionCard myPosition={rankingsData.myPosition} />
      )}

      {/* ランキングリスト */}
      {rankingsData.isInitialLoading ? (
        <RankingLoadingState />
      ) : rankingsData.data && rankingsData.data.length > 0 ? (
        <FlatList
          data={rankingsData.data as RankingItem[]}
          keyExtractor={(item, index) => {
            const contributionItem = item as any;
            const hostItem = item as any;
            return `${contributionItem.userId || hostItem.hostUserId || index}-${index}`;
          }}
          renderItem={({ item, index }) => (
            <RankingRow item={item} index={index} tab={rankingsData.tab} />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={rankingsData.refreshing} 
              onRefresh={rankingsData.onRefresh} 
              tintColor={color.hostAccentLegacy} 
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={Platform.OS !== "web"}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <RankingEmptyState />
      )}
    </ScreenContainer>
  );
}
