import { FlatList, Text, View, Pressable, RefreshControl, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { navigate } from "@/lib/navigation";
import { useState } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { ScreenLoadingState } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppHeader } from "@/components/organisms/app-header";
import { useAuth } from "@/hooks/use-auth";

export default function FollowersScreen() {
  
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // userIdが指定されていない場合は自分のフォロワーを表示
  const targetUserId = userId ? parseInt(userId) : user?.id;
  
  const { data: followers, isLoading, refetch } = trpc.follows.followers.useQuery(
    { userId: targetUserId || 0 },
    { enabled: !!targetUserId }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ヘッダー */}
      <AppHeader 
        title="君斗りんくの動員ちゃれんじ" 
        showCharacters={false}
        rightElement={
          <Pressable
            onPress={() => navigate.back()}
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
          フォロワー
        </Text>
      </View>

      {isLoading ? (
        <ScreenLoadingState />
      ) : followers && followers.length > 0 ? (
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => {
                if (item.followerId) {
                  navigate.toProfile(item.followerId);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: 72,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: color.border,
              }}
            >
              {item.followerImage ? (
                <Image
                  source={{ uri: item.followerImage }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: color.accentPrimary,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ color: color.textWhite, fontSize: 20, fontWeight: "bold" }}>
                    {(item.followerName || "?")[0]}
                  </Text>
                </View>
              )}
              
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "600" }}>
                  {item.followerName || "不明なユーザー"}
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleDateString("ja-JP")} からフォロー
                </Text>
              </View>
              
              <MaterialIcons name="chevron-right" size={24} color={color.textMuted} />
            </Pressable>
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
          <MaterialIcons name="people-outline" size={64} color={color.textSubtle} />
          <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
            まだフォロワーがいません
          </Text>
          <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center" }}>
            チャレンジを作成して{"\n"}フォロワーを増やしましょう
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
