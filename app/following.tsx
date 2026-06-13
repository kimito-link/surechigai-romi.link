import { FlatList, Text, View, Pressable, RefreshControl, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import { useState } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { ScreenLoadingState } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { navigateBack } from "@/lib/navigation/app-routes";

export default function FollowingScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: following, isLoading, refetch } = trpc.follows.following.useQuery();
  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => refetch(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUnfollow = (followeeId: number) => {
    unfollowMutation.mutate({ followeeId });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
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
            <Text style={{ color: color.textWhite, marginLeft: 8 }}>戻る</Text>
          </Pressable>
        }
      />
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: color.border,
      }}>
        <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold" }}>
          フォロー中
        </Text>
      </View>

      {isLoading ? (
        <ScreenLoadingState />
      ) : following && following.length > 0 ? (
        <FlatList
          data={following}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}>
              {item.followeeImage ? (
                <Image
                  source={{ uri: item.followeeImage }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: color.hostAccentLegacy,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold" }}>
                    {(item.followeeName || "?")[0]}
                  </Text>
                </View>
              )}
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>
                  {item.followeeName || "不明なユーザー"}
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleDateString("ja-JP")} からフォロー中
                </Text>
              </View>
              
              <Pressable
                onPress={() => handleUnfollow(item.followeeId)}
                style={{
                  minHeight: 44,
                  minWidth: 100,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 22,
                  backgroundColor: color.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "500" }}>フォロー解除</Text>
              </Pressable>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.hostAccentLegacy} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          // パフォーマンス最適化
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={Platform.OS !== "web"}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <MaterialIcons name="person-add" size={64} color={color.textSubtle} />
          <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
            まだ誰もフォローしていません
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center" }}>
            チャレンジ詳細画面から主催者をフォローすると{"\n"}新着チャレンジの通知を受け取れます
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
