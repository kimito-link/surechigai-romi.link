import { View, FlatList, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ColorfulChallengeCard } from "@/components/molecules/colorful-challenge-card";
import { SectionHeader } from "@/components/ui";
import { useFavorites } from "@/hooks/use-favorites";
import { trpc } from "@/lib/trpc";

/**
 * マイページ - 気になるイベントリスト
 * 
 * お気に入り登録したチャレンジを表示
 */
export function FavoriteSection() {
  const router = useRouter();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  
  // 全チャレンジを取得してお気に入りのみフィルタリング
  const { data: allChallenges } = trpc.events.list.useQuery();
  
  // お気に入りIDに該当するチャレンジのみ抽出
  const favoriteChallenges = (allChallenges || []).filter((event: any) =>
    favorites.includes(event.id)
  );
  
  // お気に入りが0件の場合は非表示
  if (favoriteChallenges.length === 0) {
    return null;
  }
  
  return (
    <View style={{ marginBottom: 32 }}>
      <SectionHeader
        title="気になるイベントリスト"
        subtitle={`${favoriteChallenges.length}件`}
        style={{ marginBottom: 16, paddingHorizontal: 16 }}
      />
      {/* チャレンジカード一覧 */}
      <FlatList
        data={favoriteChallenges}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 12,
        }}
        keyExtractor={(item: any) => item.id.toString()}
        windowSize={3}
        maxToRenderPerBatch={5}
        initialNumToRender={4}
        removeClippedSubviews={Platform.OS !== "web"}
        updateCellsBatchingPeriod={50}
        renderItem={({ item }: { item: any }) => (
          <View style={{ width: 280 }}>
            <ColorfulChallengeCard
              challenge={item}
              onPress={() => {
                router.push(`/event/${item.id}`);
              }}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          </View>
        )}
      />
    </View>
  );
}
