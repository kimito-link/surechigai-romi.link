/**
 * チャレンジ管理画面
 * 
 * チャレンジの一覧・編集・公開設定
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { ScreenLoadingState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { useLoadingState } from "@/hooks/use-loading-state";
import { trpc } from "@/lib/trpc";
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { navigate } from "@/lib/navigation/app-routes";

export default function ChallengesScreen() {
  const colors = useColors();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  // チャレンジ一覧を取得
  const { data: challenges, isLoading, isFetching, refetch } = trpc.events.list.useQuery();
  
  // ローディング状態を分離
  const hasData = !!challenges && challenges.length >= 0;
  const loadingState = useLoadingState({
    isLoading,
    isFetching,
    hasData,
  });

  // 公開状態を切り替え
  const togglePublicMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert(commonCopy.alerts.error, error.message);
    },
  });

  // チャレンジを削除
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert(commonCopy.alerts.error, error.message);
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleTogglePublic = (challenge: any) => {
    togglePublicMutation.mutate({
      id: challenge.id,
      isPublic: !challenge.isPublic,
    });
  };

  const handleDelete = (challenge: any) => {
    const confirmDelete = () => {
      deleteMutation.mutate({ id: challenge.id });
    };

    if (Platform.OS === "web") {
      if (window.confirm(`「${challenge.title}」を削除しますか？この操作は取り消せません。`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        commonCopy.alerts.deleteConfirm,
        `「${challenge.title}」を削除しますか？この操作は取り消せません。`,
        [
          { text: "キャンセル", style: "cancel" },
          { text: "削除", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const filteredChallenges = challenges?.filter((c: any) => {
    if (filter === "public") return c.isPublic;
    if (filter === "private") return !c.isPublic;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loadingState.isInitialLoading) {
    return <ScreenLoadingState message={commonCopy.loading.challenge} />;
  }

  return (
    <ScreenContainer>
      {loadingState.isRefreshing && <RefreshingIndicator isRefreshing={loadingState.isRefreshing} />}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">チャレンジ管理</Text>
          <Text className="text-sm text-muted mt-1">
            {challenges?.length || 0} 件のチャレンジ
          </Text>
        </View>

        {/* フィルター */}
        <View className="flex-row gap-2 mb-4">
          {[
            { key: "all", label: "すべて" },
            { key: "public", label: "公開中" },
            { key: "private", label: "非公開" },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key as any)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === item.key ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: filter === item.key ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  color: filter === item.key ? color.textWhite : colors.foreground,
                  fontWeight: filter === item.key ? "600" : "400",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 統計 */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-surface p-4 rounded-lg border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {challenges?.filter((c: any) => c.isPublic).length || 0}
            </Text>
            <Text className="text-xs text-muted">公開中</Text>
          </View>
          <View className="flex-1 bg-surface p-4 rounded-lg border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {challenges?.filter((c: any) => !c.isPublic).length || 0}
            </Text>
            <Text className="text-xs text-muted">非公開</Text>
          </View>
          <View className="flex-1 bg-surface p-4 rounded-lg border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {challenges?.filter((c: any) => new Date(c.eventDate) > new Date()).length || 0}
            </Text>
            <Text className="text-xs text-muted">開催予定</Text>
          </View>
        </View>

        {/* チャレンジリスト */}
        {filteredChallenges && filteredChallenges.length > 0 ? (
          <View className="gap-3">
            {filteredChallenges.map((challenge: any) => (
              <View
                key={challenge.id}
                className="bg-surface rounded-xl border border-border overflow-hidden"
              >
                <View className="p-4">
                  {/* ヘッダー */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-semibold text-foreground" numberOfLines={2}>
                        {challenge.title}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {challenge.hostName} (@{challenge.hostUsername})
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: challenge.isPublic
                          ? colors.success + "20"
                          : colors.muted + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{
                          color: challenge.isPublic ? colors.success : colors.muted,
                        }}
                      >
                        {challenge.isPublic ? "公開" : "非公開"}
                      </Text>
                    </View>
                  </View>

                  {/* 詳細情報 */}
                  <View className="flex-row flex-wrap gap-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted ml-1">
                        {formatDate(challenge.eventDate)}
                      </Text>
                    </View>
                    {challenge.venue && (
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted ml-1" numberOfLines={1}>
                          {challenge.venue}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center">
                      <Ionicons name="flag-outline" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted ml-1">
                        目標: {challenge.goalValue?.toLocaleString() || 0} {challenge.goalUnit || "人"}
                      </Text>
                    </View>
                  </View>

                  {/* アクション */}
                  <View className="flex-row gap-2 pt-3 border-t border-border">
                    <Pressable
                      onPress={() => navigate.toAdminChallenge(challenge.id)}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: colors.primary + "20",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Ionicons name="eye-outline" size={16} color={colors.primary} />
                      <Text className="ml-1" style={{ color: colors.primary }}>
                        表示
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => handleTogglePublic(challenge)}
                      disabled={togglePublicMutation.isPending}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: challenge.isPublic
                          ? colors.warning + "20"
                          : colors.success + "20",
                        opacity: pressed || togglePublicMutation.isPending ? 0.7 : 1,
                      })}
                    >
                      <Ionicons
                        name={challenge.isPublic ? "eye-off-outline" : "eye-outline"}
                        size={16}
                        color={challenge.isPublic ? colors.warning : colors.success}
                      />
                      <Text
                        className="ml-1"
                        style={{
                          color: challenge.isPublic ? colors.warning : colors.success,
                        }}
                      >
                        {challenge.isPublic ? "非公開に" : "公開する"}
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      onPress={() => handleDelete(challenge)}
                      disabled={deleteMutation.isPending}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: colors.error + "20",
                        opacity: pressed || deleteMutation.isPending ? 0.7 : 1,
                      })}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Ionicons name="trophy-outline" size={48} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">
              {commonCopy.empty.noChallenges}
            </Text>
            <Text className="text-muted text-center mt-2">
              {filter !== "all"
                ? "フィルターを変更してみてください"
                : "チャレンジ作成画面から新しいチャレンジを作成できます"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
