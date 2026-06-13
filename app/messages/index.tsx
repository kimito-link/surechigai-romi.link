import { View, Text, FlatList, Pressable, Image, Platform } from "react-native";
import { EmojiIcon } from "@/components/ui/emoji-icon";
import { LoadingMoreIndicator } from "@/components/molecules/loading-more-indicator";
import { ScreenLoadingState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { navigate, navigateBack } from "@/lib/navigation";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useLoadingState } from "@/hooks/use-loading-state";
import { AppHeader } from "@/components/organisms/app-header";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { useWebSocket } from "@/lib/websocket-client";
import { useQueryClient } from "@tanstack/react-query";

export default function MessagesScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // WebSocket接続を確立
  useWebSocket({
    onMessage: (message) => {
      console.log("[Messages] New message received:", message);
      // メッセージ一覧を再取得
      queryClient.invalidateQueries({ queryKey: [["dm", "conversations"]] });
      queryClient.invalidateQueries({ queryKey: [["dm", "unreadCount"]] });
    },
    enabled: !!user,
  });

  // 会話一覧を取得（無限スクロール対応）
  const { 
    data, 
    isLoading, 
    isFetching, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = trpc.dm.conversations.useInfiniteQuery(
    { limit: 20 },
    {
      enabled: !!user,
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
      gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持
    }
  );

  // ページをフラット化
  const conversations = data?.pages.flatMap((page: any) => page.items) ?? [];

  // ローディング状態を分離
  const hasData = conversations.length > 0;
  const loadingState = useLoadingState({
    isLoading,
    isFetching,
    hasData,
    isFetchingNextPage,
  });
  const { data: unreadCount } = trpc.dm.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-4">
            <EmojiIcon emoji="💬" size={48} />
          </View>
          <Text className="text-lg text-muted text-center">
            メッセージを見るにはログインが必要です
          </Text>
          <Pressable
            onPress={() => navigate.toOAuth()}
            className="mt-4 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-background font-bold">ログイン</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const renderConversation = ({ item }: { item: NonNullable<typeof conversations>[0] }) => {
    const partnerId = item.fromUserId === user.id ? item.toUserId : item.fromUserId;
    const partnerName = item.fromUserId === user.id ? "相手" : item.fromUserName;
    const isUnread = item.toUserId === user.id && !item.isRead;

    return (
      <Pressable
        onPress={() => navigate.toMessages(partnerId, item.challengeId)}
        className={`flex-row items-center p-4 border-b border-border ${isUnread ? "bg-primary/10" : ""}`}
        
      >
        {/* アバター */}
        <View className="w-12 h-12 rounded-full bg-surface items-center justify-center mr-3">
          {item.fromUserImage ? (
            <Image
              source={{ uri: item.fromUserImage }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <EmojiIcon emoji="👤" size={24} />
          )}
        </View>

        {/* メッセージ情報 */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className={`font-bold ${isUnread ? "text-foreground" : "text-muted"}`}>
              {partnerName}
            </Text>
            <Text className="text-xs text-muted">
              {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <Text
            className={`text-sm mt-1 ${isUnread ? "text-foreground" : "text-muted"}`}
            numberOfLines={1}
          >
            {item.message}
          </Text>
        </View>

        {/* 未読バッジ */}
        {isUnread && (
          <View className="w-3 h-3 rounded-full bg-primary ml-2" />
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      {/* ヘッダー */}
      <AppHeader 
        title="君斗りんくの動員ちゃれんじ" 
        showCharacters={false}
        rightElement={
          <View className="flex-row items-center gap-4">
            {unreadCount && unreadCount > 0 && (
              <View className="bg-primary rounded-full px-2 py-1">
                <Text className="text-xs text-background font-bold text-center">
                  {unreadCount}
                </Text>
              </View>
            )}
            <Pressable onPress={() => navigateBack()} className="flex-row items-center">
              <Text className="text-foreground">← 戻る</Text>
            </Pressable>
          </View>
        }
      />
      <View className="p-4 border-b border-border">
        <Text className="text-xl font-bold text-foreground">メッセージ</Text>
      </View>

      {/* 会話一覧 */}
      {loadingState.isRefreshing && <RefreshingIndicator isRefreshing={loadingState.isRefreshing} />}
      {loadingState.isInitialLoading ? (
        <ScreenLoadingState message={commonCopy.loading.messages} />
      ) : conversations && conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => `${item.id}`}
          showsVerticalScrollIndicator={false}
          // 無限スクロール
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            <LoadingMoreIndicator isLoadingMore={isFetchingNextPage} />
          )}
          // パフォーマンス最適化
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={Platform.OS !== "web"}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-4">
            <EmojiIcon emoji="💬" size={48} />
          </View>
          <Text className="text-lg font-bold text-foreground mb-2">
            {commonCopy.empty.noMessages}
          </Text>
          <Text className="text-sm text-muted text-center">
            チャレンジの参加者にメッセージを送ってみましょう
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
