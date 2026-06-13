/**
 * HomeListHeader Component
 * ホーム画面のFlatListヘッダー部分
 * v6.27: タブナビゲーション追加、UI改善
 */

import { useEffect, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { OnboardingSteps } from "@/components/organisms/onboarding-steps";
import { ChallengeCardSkeleton } from "@/components/atoms/skeleton-loader";
import { 
  SectionHeader,
  SearchBar,
  CategoryFilter,
  RankingTop3,
  SimpleRegionMap,
  ExperienceBanner,
  HomeTabNavigation,
  type HomeTabType,
} from "./index";
import type { Challenge, FilterType } from "@/types/challenge";

interface HomeListHeaderProps {
  // Search
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
  isSearching: boolean;
  
  // Filters
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  categoryFilter: number | null;
  onCategoryFilterChange: (categoryId: number | null) => void;
  categoriesData: any;
  
  // Tab
  activeTab?: HomeTabType;
  onTabChange?: (tab: HomeTabType) => void;
  tabCounts?: {
    all: number;
    solo: number;
    group: number;
    favorite: number;
  };
  
  // Data
  top3: Challenge[];
  featuredChallenge: Challenge | null;
  displayChallengesCount: number;
  isInitialLoading?: boolean;
  /** @deprecated Use isInitialLoading instead */
  isDataLoading: boolean;
  totalChallengesCount?: number;
  
  // Handlers
  onChallengePress: (id: number) => void;
  /** ロードタイムアウト時の再試行 */
  onRetry?: () => void;
}

export function HomeListHeader({
  searchQuery,
  onSearchChange,
  onSearchClear,
  isSearching,
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoriesData,
  activeTab = "all",
  onTabChange,
  tabCounts,
  top3,
  featuredChallenge,
  displayChallengesCount,
  isInitialLoading,
  isDataLoading,
  totalChallengesCount = 0,
  onChallengePress,
  onRetry,
}: HomeListHeaderProps) {
  // 後方互換性のためisInitialLoadingを優先
  const loading = isInitialLoading ?? isDataLoading;
  // 15秒以上ロードが続く場合はタイムアウトUIを表示
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }
    const t = setTimeout(() => setLoadingTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, [loading]);
  // フィルターが適用されているかどうか
  const isFilterApplied = filter !== "all" || categoryFilter !== null;
  // フィルター適用後に該当なしの場合
  const noResultsAfterFilter = isFilterApplied && displayChallengesCount === 0 && totalChallengesCount > 0 && !loading;
  // タブ変更時にフィルターも連動
  const handleTabChange = (tab: HomeTabType) => {
    onTabChange?.(tab);
    // タブに応じてフィルターを変更
    if (tab === "solo") {
      onFilterChange("solo");
    } else if (tab === "group") {
      onFilterChange("group");
    } else if (tab === "favorite") {
      onFilterChange("favorites");
    } else {
      onFilterChange("all");
    }
  };

  return (
    <>
      {/* 検索バー */}
      <SearchBar
        value={searchQuery}
        onChangeText={(text) => {
          onSearchChange(text);
        }}
        onClear={onSearchClear}
      />

      {/* タブナビゲーション */}
      {onTabChange && (
        <HomeTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={tabCounts}
        />
      )}

      {/* カテゴリフィルター */}
      <CategoryFilter
        categories={categoriesData}
        selectedCategory={categoryFilter}
        onSelectCategory={onCategoryFilterChange}
      />

      {/* フィルター適用後に該当なしの場合のメッセージ */}
      {noResultsAfterFilter && (
        <View style={{ padding: 32, alignItems: "center" }}>
          <Text style={{ fontSize: homeFont.display, marginBottom: 16 }}>
            {filter === "favorites" ? "⭐" : filter === "solo" ? "👤" : filter === "group" ? "👥" : "🔍"}
          </Text>
          <Text style={{ color: homeText.primary, fontSize: homeFont.title, textAlign: "center", marginBottom: 8 }}>
            {filter === "favorites" 
              ? "お気に入りのチャレンジはまだありません"
              : filter === "solo"
              ? "ソロチャレンジはまだありません"
              : filter === "group"
              ? "グループチャレンジはまだありません"
              : categoryFilter
              ? "このカテゴリのチャレンジはまだありません"
              : "該当するチャレンジがありません"}
          </Text>
          <Text style={{ color: homeText.hint, fontSize: homeFont.body, textAlign: "center" }}>
            {filter === "favorites" 
              ? "チャレンジの☆ボタンを押してお気に入りに追加しよう"
              : "「総合」タブで全てのチャレンジを見る"}
          </Text>
        </View>
      )}

      {/* ランキングTop3（フィルター適用後に該当なしでない場合のみ表示） */}
      {!isSearching && !noResultsAfterFilter && top3.length > 0 && (
        <RankingTop3
          top3={top3}
          onPress={(id) => onChallengePress(id)}
          onQuickJoin={(id) => onChallengePress(id)}
        />
      )}

      {/* 4位以降のヘッダー */}
      {!isSearching && !noResultsAfterFilter && top3.length > 0 && (
        <SectionHeader title="📋 4位以降のチャレンジ" />
      )}

      {/* 簡易地域マップ */}
      {!isSearching && !noResultsAfterFilter && featuredChallenge && (
        <SimpleRegionMap
          totalCount={featuredChallenge.currentValue}
          onPress={() => onChallengePress(featuredChallenge.id)}
          challengeId={featuredChallenge.id}
        />
      )}

      {/* 3ステップ説明（初回訪問時のみ表示） */}
      {displayChallengesCount === 0 && !loading && !noResultsAfterFilter && (
        <OnboardingSteps />
      )}

      {/* デモ体験ボタン（フィルター適用時は非表示） */}
      {!isFilterApplied && <ExperienceBanner />}
      
      {/* 初回ロード中のスケルトン表示 */}
      {loading && !loadingTimedOut && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <ChallengeCardSkeleton />
          <ChallengeCardSkeleton />
          <ChallengeCardSkeleton />
        </View>
      )}
      {/* ロードタイムアウト時の再試行UI */}
      {loading && loadingTimedOut && (
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, alignItems: "center" }}>
          <Text style={{ color: homeText.primary, fontSize: homeFont.body, textAlign: "center", marginBottom: 12 }}>
            読み込みに時間がかかっています
          </Text>
          <Text style={{ color: homeText.hint, fontSize: homeFont.meta, textAlign: "center", marginBottom: 16 }}>
            ネットワーク接続を確認して、もう一度お試しください
          </Text>
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {onRetry && (
              <Pressable
                onPress={() => {
                  setLoadingTimedOut(false);
                  onRetry();
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor: color.accentPrimary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>再試行</Text>
              </Pressable>
            )}
            {Platform.OS === "web" && typeof window !== "undefined" && (
              <Pressable
                onPress={() => window.location.reload()}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: color.borderAlt,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ color: color.textMuted, fontSize: 14 }}>ページをリロード</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </>
  );
}
