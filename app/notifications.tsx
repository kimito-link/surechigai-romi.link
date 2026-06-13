import { Text, View, Pressable, FlatList, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { navigate, navigateBack } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";
import { AppHeader } from "@/components/organisms/app-header";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { NotificationItemCard, type NotificationListItem } from "@/components/molecules/notification-item-card";
import { LoadingMoreIndicator } from "@/components/molecules/loading-more-indicator";
import { ScreenLoadingState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { useWebSocket } from "@/lib/websocket-client";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  
  const { isAuthenticated } = useAuth();
  
  // WebSocket接続を確立
  useWebSocket({
    onNotification: (notification) => {
      console.log("[Notifications] New notification received:", notification);
      // 通知一覧を再取得
      queryClient.invalidateQueries({ queryKey: [["notifications", "list"]] });
    },
    enabled: isAuthenticated,
  });
  
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  // 通知履歴を取得（無限スクロール対応）
  const { 
    data, 
    isLoading, 
    isFetching, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = trpc.notifications.list.useInfiniteQuery(
    { limit: 20 },
    {
      enabled: isAuthenticated,
      getNextPageParam: (lastPage: any) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
      gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持
    }
  );

  // ページをフラット化
  const notificationList = data?.pages.flatMap((page: any) => page.items) ?? [];

  // ローディング状態を分離
  const hasData = notificationList.length > 0;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData && !isFetchingNextPage;
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (Platform.OS === "web") return;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== "granted") {
      setNotificationPermission(false);
      return;
    }
    
    setNotificationPermission(true);
    
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log("[Notifications] Push token:", token.data);
    } catch (error) {
      console.error("Failed to get push token:", error);
    }
  };

  const unreadCount = notificationList?.filter(n => !n.isRead).length || 0;

  if (!isAuthenticated) {
    return (
      <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <MaterialIcons name="notifications-off" size={64} color={color.textSubtle} />
          <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 16, textAlign: "center" }}>
            通知を受け取るにはログインが必要です
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      {isRefreshing && <RefreshingIndicator isRefreshing={isRefreshing} />}

        {/* ヘッダー */}
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          rightElement={
            <Pressable
              onPress={() => navigateBack()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
              <Text style={{ color: colors.foreground, marginLeft: 8 }}>戻る</Text>
            </Pressable>
          }
        />
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "bold" }}>
              通知
            </Text>
            {unreadCount > 0 && (
              <View
                style={{
                  backgroundColor: color.accentPrimary,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "bold" }}>
                  {unreadCount}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {unreadCount > 0 && (
              <Pressable
                onPress={() => markAllAsReadMutation.mutate()}
                style={{
                  backgroundColor: color.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: color.accentPrimary, fontSize: 12 }}>すべて既読</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* 通知許可状態 */}
        {Platform.OS !== "web" && !notificationPermission && (
          <View
            style={{
              backgroundColor: color.surface,
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: color.warning,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="warning" size={24} color={color.warning} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold" }}>
                  プッシュ通知が無効です
                </Text>
                <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 4 }}>
                  設定からプッシュ通知を有効にしてください
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 通知リスト */}
        {isInitialLoading ? (
          <ScreenLoadingState message={commonCopy.loading.notifications} />
        ) : (
          <FlatList
            data={notificationList}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            removeClippedSubviews={Platform.OS !== "web"}
            updateCellsBatchingPeriod={50}
            renderItem={({ item: notification }) => (
              <NotificationItemCard
                notification={notification as NotificationListItem}
                onPress={() => {
                  if (!notification.isRead) {
                    markAsReadMutation.mutate({ id: notification.id });
                  }
                  navigate.toEventDetail(notification.challengeId);
                }}
                foregroundColor={colors.foreground}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              <LoadingMoreIndicator isLoadingMore={isFetchingNextPage} />
            )}
            ListEmptyComponent={() => (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <MaterialIcons name="notifications-none" size={64} color={color.textSubtle} />
                <Text style={{ color: color.textMuted, fontSize: 16, marginTop: 16 }}>
                  {commonCopy.empty.noNotifications}
                </Text>
              </View>
            )}
          />
        )}
    </ScreenContainer>
  );
}
