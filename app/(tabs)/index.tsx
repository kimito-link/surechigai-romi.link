/**
 * ホーム画面
 * チャレンジ一覧とランキングを表示
 * v6.27: タブナビゲーション追加、UI改善
 */

import { View, FlatList, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";

import { useResponsive, useGridLayout } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/organisms/app-header";
import { SimpleRefreshControl } from "@/components/molecules/enhanced-refresh-control";
import { ColorfulChallengeCard } from "@/components/molecules/colorful-challenge-card";
import { FloatingActionButton } from "@/components/atoms/floating-action-button";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { EncouragementModal, useEncouragementModal } from "@/components/molecules/encouragement-modal";
import { 
  ChallengeCard, 
  RankingRow,
  HomeListHeader,
  HomeListFooter,
  HomeEmptyState,
  useHomeData,
  useHomeActions,
  type HomeTabType,
} from "@/features/home";
import type { Challenge, FilterType } from "@/types/challenge";
import { usePerformanceMonitor } from "@/lib/performance-monitor";
import { InstallPrompt } from "@/components/install-prompt";

export default function HomeScreen() {
  const { isDesktop } = useResponsive();
  const { user } = useAuth();
  const grid = useGridLayout({ minItemWidth: 280, maxColumns: 4, desktopMaxWidth: 1200 });
  const numColumns = grid.numColumns;
  
  // フィルター状態
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [useColorfulCards] = useState(true);
  
  // タブ状態
  const [activeTab, setActiveTab] = useState<HomeTabType>("all");
  
  // 励ましメッセージモーダル
  const encouragementModal = useEncouragementModal();
  
  // データ取得フック
  const homeData = useHomeData({
    filter,
    searchQuery,
    categoryFilter,
  });
  
  // Performance monitoring
  usePerformanceMonitor(
    "Home",
    homeData.hasData,
    homeData.isInitialLoading,
    !homeData.hasData
  );
  
  // アクションフック
  const homeActions = useHomeActions({
    refetch: homeData.refetch,
  });

  // 検索ハンドラー
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  // レンダーアイテム（メモ化でスクロール時の再レンダーを削減）
  const renderItem = useCallback(
    ({ item, index }: { item: Challenge; index: number }) => {
      if (isSearching) {
        const cardProps = {
          challenge: item,
          onPress: () => homeActions.handleChallengePress(item.id),
          numColumns,
          width: grid.itemWidth,
          colorIndex: index,
          isFavorite: homeData.isFavorite(item.id),
          onToggleFavorite: homeData.toggleFavorite,
          currentUserTwitterId: user?.twitterId,
          onEdit: homeActions.handleChallengeEdit,
          onDelete: homeActions.handleChallengeDelete,
        };
        return useColorfulCards ? (
          <ColorfulChallengeCard {...cardProps} />
        ) : (
          <ChallengeCard {...cardProps} />
        );
      }
      return (
        <View style={{ marginHorizontal: 16, marginTop: 10 }}>
          <RankingRow
            rank={index + 4}
            challenge={item}
            onPress={() => homeActions.handleChallengePress(item.id)}
            onQuickJoin={() => homeActions.handleChallengePress(item.id)}
          />
        </View>
      );
    },
    [
      isSearching,
      useColorfulCards,
      numColumns,
      grid.itemWidth,
      user?.twitterId,
      homeActions,
      homeData,
    ]
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* 更新中インジケータ */}
      <RefreshingIndicator isRefreshing={homeData.isRefreshing} />
      
      {/* ヘッダー */}
      <AppHeader 
        title="君斗りんくの動員ちゃれんじ" 
        showCharacters={true}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={true}
      />

      {/* チャレンジリスト */}
      {homeData.displayChallenges.length > 0 || homeData.isInitialLoading ? (
        <FlatList
          key={isSearching ? `grid-${numColumns}` : "ranking-list"}
          data={isSearching ? homeData.displayChallenges : homeData.rest}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isSearching ? numColumns : 1}
          ListHeaderComponent={
            <HomeListHeader
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchClear={handleSearchClear}
              isSearching={isSearching}
              filter={filter}
              onFilterChange={setFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              categoriesData={homeData.categoriesData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabCounts={homeData.tabCounts}
              top3={homeData.top3}
              featuredChallenge={homeData.featuredChallenge}
              displayChallengesCount={homeData.displayChallenges.length}
              totalChallengesCount={homeData.challenges.length}
              isInitialLoading={homeData.isInitialLoading}
              isDataLoading={homeData.isDataLoading}
              onChallengePress={homeActions.handleChallengePress}
              onRetry={homeData.refetch}
            />
          }
          renderItem={renderItem}
          refreshControl={
            <SimpleRefreshControl 
              refreshing={homeData.refreshing} 
              onRefresh={homeData.onRefresh} 
            />
          }
          onEndReached={() => {
            if (isSearching) {
              if (homeData.hasNextSearchPage && !homeData.isFetchingNextSearchPage) {
                homeData.fetchNextSearchPage();
              }
            } else {
              if (homeData.hasNextPage && !homeData.isFetchingNextPage) {
                homeData.fetchNextPage();
              }
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <HomeListFooter
              featuredChallenge={homeData.featuredChallenge}
              effectiveChallenges={homeData.challenges}
              isSearching={isSearching}
              isOffline={homeData.isOffline}
              isStaleData={homeData.isStaleData}
              isLoadingMore={homeData.isLoadingMore}
              isFetchingNextPage={homeData.isFetchingNextPage}
              hasNextPage={homeData.hasNextPage}
              isFetchingNextSearchPage={homeData.isFetchingNextSearchPage}
              hasNextSearchPage={homeData.hasNextSearchPage}
              onChallengePress={homeActions.handleChallengePress}
            />
          }
          contentContainerStyle={{ 
            paddingHorizontal: grid.paddingHorizontal, 
            paddingBottom: 100,
            backgroundColor: color.bg,
            maxWidth: grid.maxWidth,
            alignSelf: grid.maxWidth ? "center" : undefined,
            width: grid.maxWidth ? "100%" : undefined,
          }}
          style={{ backgroundColor: color.bg }}
          columnWrapperStyle={isSearching && numColumns > 1 ? { justifyContent: "flex-start", gap: grid.gap } : undefined}
          windowSize={3}
          maxToRenderPerBatch={4}
          initialNumToRender={4}
          removeClippedSubviews={Platform.OS !== "web"}
          updateCellsBatchingPeriod={100}
        />
      ) : (
        <HomeEmptyState onGenerateSamples={homeData.refetch} />
      )}

      {/* FABボタン */}
      <FloatingActionButton
        onPress={homeActions.handleCreateChallenge}
        icon="add"
        size="large"
      />

      {/* 励ましメッセージモーダル */}
      <EncouragementModal
        visible={encouragementModal.visible}
        onClose={encouragementModal.hide}
        type={encouragementModal.type}
        customMessage={encouragementModal.customMessage}
        customEmoji={encouragementModal.customEmoji}
      />

      {/* PWAインストールプロンプト */}
      <InstallPrompt />
    </ScreenContainer>
  );
}
