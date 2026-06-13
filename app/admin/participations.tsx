/**
 * 参加管理画面
 * 
 * 削除済み参加（応援メッセージ）の管理
 * - 削除済み一覧表示
 * - 個別復元
 * - 一括削除・復元
 * - 監査ログ表示
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { ScreenLoadingState, InlineErrorBar } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { useColors } from "@/hooks/use-colors";
import { useLoadingState } from "@/hooks/use-loading-state";
import { color } from "@/theme/tokens";
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
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type TabType = "deleted" | "audit";

interface DeletedParticipation {
  id: number;
  challengeId: number | null;
  userId: number | null;
  displayName: string | null;
  username: string | null;
  message: string | null;
  deletedAt: Date | null;
  deletedBy: number | null;
  createdAt: Date;
}

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  targetId: number | null;
  actorId: number | null;
  actorName: string | null;
  requestId: string;
  createdAt: Date;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
}

export default function ParticipationsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("deleted");
  const [filterChallengeId, setFilterChallengeId] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // 削除済み参加一覧を取得
  const {
    data: deletedParticipations,
    isLoading: isLoadingDeleted,
    isFetching: isFetchingDeleted,
    refetch: refetchDeleted,
    error: deletedError,
  } = trpc.admin.participations.listDeleted.useQuery(
    {
      challengeId: filterChallengeId ? parseInt(filterChallengeId, 10) : undefined,
      userId: filterUserId ? parseInt(filterUserId, 10) : undefined,
      limit: 100,
    },
    { retry: false }
  );

  // 監査ログを取得
  const {
    data: auditLogs,
    isLoading: isLoadingAudit,
    isFetching: isFetchingAudit,
    refetch: refetchAudit,
    error: auditError,
  } = trpc.admin.participations.getAuditLogs.useQuery(
    { entityType: "participation", limit: 50 },
    { retry: false, enabled: activeTab === "audit" }
  );

  // 復元ミューテーション
  const restoreMutation = trpc.admin.participations.restore.useMutation({
    onSuccess: (data: { requestId: string }) => {
      utils.admin.participations.listDeleted.invalidate();
      utils.admin.participations.getAuditLogs.invalidate();
      const message = `復元しました (requestId: ${data.requestId})`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.success, message);
      }
    },
    onError: (err: { message: string }) => {
      const message = `エラー: ${err.message}`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.error, message);
      }
    },
  });

  // 一括復元ミューテーション
  const bulkRestoreMutation = trpc.admin.participations.bulkRestore.useMutation({
    onSuccess: (data: { restoredCount: number; requestId: string }) => {
      utils.admin.participations.listDeleted.invalidate();
      utils.admin.participations.getAuditLogs.invalidate();
      const message = `${data.restoredCount}件を復元しました (requestId: ${data.requestId})`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.success, message);
      }
    },
    onError: (err: { message: string }) => {
      const message = `エラー: ${err.message}`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.error, message);
      }
    },
  });

  // 一括削除ミューテーション
  const bulkDeleteMutation = trpc.admin.participations.bulkDelete.useMutation({
    onSuccess: (data: { deletedCount: number; requestId: string }) => {
      utils.admin.participations.listDeleted.invalidate();
      utils.admin.participations.getAuditLogs.invalidate();
      const message = `${data.deletedCount}件を削除しました (requestId: ${data.requestId})`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.success, message);
      }
    },
    onError: (err: { message: string }) => {
      const message = `エラー: ${err.message}`;
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.error, message);
      }
    },
  });

  const handleRestore = (id: number) => {
    const confirmMessage = "この参加を復元しますか？";
    if (Platform.OS === "web") {
      if (window.confirm(confirmMessage)) {
        restoreMutation.mutate({ id });
      }
    } else {
      Alert.alert(commonCopy.alerts.confirm, confirmMessage, [
        { text: "キャンセル", style: "cancel" },
        { text: "復元", onPress: () => restoreMutation.mutate({ id }) },
      ]);
    }
  };

  const handleBulkRestore = () => {
    if (!filterChallengeId && !filterUserId) {
      const message = "一括復元にはチャレンジIDまたはユーザーIDのフィルターが必要です";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.error, message);
      }
      return;
    }

    const count = deletedParticipations?.length || 0;
    const confirmMessage = `${count}件の削除済み参加表明を復元しますか？`;
    if (Platform.OS === "web") {
      if (window.confirm(confirmMessage)) {
        bulkRestoreMutation.mutate({
          challengeId: filterChallengeId ? parseInt(filterChallengeId, 10) : undefined,
          userId: filterUserId ? parseInt(filterUserId, 10) : undefined,
        });
      }
    } else {
      Alert.alert(commonCopy.alerts.confirm, confirmMessage, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "一括復元",
          onPress: () =>
            bulkRestoreMutation.mutate({
              challengeId: filterChallengeId ? parseInt(filterChallengeId, 10) : undefined,
              userId: filterUserId ? parseInt(filterUserId, 10) : undefined,
            }),
        },
      ]);
    }
  };

  const handleBulkDelete = () => {
    if (!filterChallengeId && !filterUserId) {
      const message = "一括削除にはチャレンジIDまたはユーザーIDのフィルターが必要です";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(commonCopy.alerts.error, message);
      }
      return;
    }

    const confirmMessage = `フィルター条件に一致する参加表明を非表示にしますか？\nこの操作は後で復元できます。`;
    if (Platform.OS === "web") {
      if (window.confirm(confirmMessage)) {
        bulkDeleteMutation.mutate({
          challengeId: filterChallengeId ? parseInt(filterChallengeId, 10) : undefined,
          userId: filterUserId ? parseInt(filterUserId, 10) : undefined,
        });
      }
    } else {
      Alert.alert(commonCopy.alerts.confirm, confirmMessage, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "一括削除",
          style: "destructive",
          onPress: () =>
            bulkDeleteMutation.mutate({
              challengeId: filterChallengeId ? parseInt(filterChallengeId, 10) : undefined,
              userId: filterUserId ? parseInt(filterUserId, 10) : undefined,
            }),
        },
      ]);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, { label: string; color: string }> = {
      CREATE: { label: "作成", color: colors.success },
      EDIT: { label: "編集", color: colors.warning },
      DELETE: { label: "削除", color: colors.error },
      RESTORE: { label: "復元", color: colors.primary },
      BULK_DELETE: { label: "一括削除", color: colors.error },
      BULK_RESTORE: { label: "一括復元", color: colors.primary },
    };
    return actionMap[action] || { label: action, color: colors.muted };
  };

  const onRefresh = useCallback(() => {
    if (activeTab === "deleted") {
      refetchDeleted();
    } else {
      refetchAudit();
    }
  }, [activeTab, refetchDeleted, refetchAudit]);

  // ローディング状態を分離
  const hasDeletedData = !!deletedParticipations && deletedParticipations.length >= 0;
  const hasAuditData = !!auditLogs && auditLogs.length >= 0;
  const hasData = activeTab === "deleted" ? hasDeletedData : hasAuditData;
  
  const isLoading = activeTab === "deleted" ? isLoadingDeleted : isLoadingAudit;
  const isFetching = activeTab === "deleted" ? isFetchingDeleted : isFetchingAudit;
  const loadingState = useLoadingState({
    isLoading,
    isFetching,
    hasData,
  });
  
  const error = activeTab === "deleted" ? deletedError : auditError;

  // 初回ロード中はスケルトン表示
  if (loadingState.isInitialLoading) {
    return <ScreenLoadingState message={commonCopy.loading.data} />;
  }

  return (
    <ScreenContainer>
      {loadingState.isRefreshing && <RefreshingIndicator isRefreshing={loadingState.isRefreshing} />}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        {/* ヘッダー */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">参加管理</Text>
          <Text className="text-sm text-muted mt-1">
            削除済み参加の復元・監査ログの確認
          </Text>
        </View>

        {/* タブ */}
        <View className="flex-row mb-4 bg-surface rounded-lg p-1 border border-border">
          <Pressable
            onPress={() => setActiveTab("deleted")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 10,
                borderRadius: 6,
                backgroundColor: activeTab === "deleted" ? colors.primary : "transparent",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              className="text-center font-medium"
              style={{ color: activeTab === "deleted" ? color.textWhite : colors.muted }}
            >
              削除済み
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("audit")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 10,
                borderRadius: 6,
                backgroundColor: activeTab === "audit" ? colors.primary : "transparent",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              className="text-center font-medium"
              style={{ color: activeTab === "audit" ? color.textWhite : colors.muted }}
            >
              監査ログ
            </Text>
          </Pressable>
        </View>

        {error && (
          <InlineErrorBar
            message={error.message}
            detail="管理者権限が必要です。ログインしているアカウントが管理者であることを確認してください。"
          />
        )}

        {/* 削除済みタブ */}
        {activeTab === "deleted" && (
          <>
            {/* フィルター */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="font-semibold text-foreground mb-3">フィルター</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">チャレンジID</Text>
                  <TextInput
                    value={filterChallengeId}
                    onChangeText={setFilterChallengeId}
                    placeholder="例: 1"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    style={{ color: colors.foreground }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">ユーザーID</Text>
                  <TextInput
                    value={filterUserId}
                    onChangeText={setFilterUserId}
                    placeholder="例: 1"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    style={{ color: colors.foreground }}
                  />
                </View>
              </View>
              <View className="flex-row gap-2 mt-3">
                <Pressable
                  onPress={() => refetchDeleted()}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-center text-white font-medium">検索</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFilterChallengeId("");
                    setFilterUserId("");
                  }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-center text-foreground font-medium">クリア</Text>
                </Pressable>
              </View>
            </View>

            {/* 一括操作 */}
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={handleBulkRestore}
                disabled={bulkRestoreMutation.isPending}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.success,
                    opacity: pressed || bulkRestoreMutation.isPending ? 0.7 : 1,
                  },
                ]}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="refresh" size={16} color={color.textWhite} />
                  <Text className="text-white font-medium ml-2">
                    {bulkRestoreMutation.isPending ? "処理中..." : "一括復元"}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.error,
                    opacity: pressed || bulkDeleteMutation.isPending ? 0.7 : 1,
                  },
                ]}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="trash" size={16} color={color.textWhite} />
                  <Text className="text-white font-medium ml-2">
                    {bulkDeleteMutation.isPending ? "処理中..." : "一括削除"}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* 統計 */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <Text className="text-muted text-sm">削除済み件数</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {deletedParticipations?.length || 0}
                </Text>
              </View>
            </View>

            {/* 削除済み一覧 */}
            {isLoadingDeleted ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-muted">読み込み中...</Text>
              </View>
            ) : deletedParticipations && deletedParticipations.length > 0 ? (
              <View className="gap-3">
                {deletedParticipations.map((p: DeletedParticipation) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View className="bg-surface rounded-xl border border-border overflow-hidden">
                      <View className="p-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="font-semibold text-foreground">
                              {p.displayName || p.username || "匿名"}
                            </Text>
                            <Text className="text-sm text-muted" numberOfLines={2}>
                              {p.message || "(メッセージなし)"}
                            </Text>
                            <Text className="text-xs text-muted mt-1">
                              削除日時: {formatDate(p.deletedAt)}
                            </Text>
                          </View>
                          <Ionicons
                            name={expandedId === p.id ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.muted}
                          />
                        </View>

                        {expandedId === p.id && (
                          <View className="mt-4 pt-4 border-t border-border">
                            <View className="gap-2">
                              <View className="flex-row">
                                <Text className="text-muted w-28">参加ID:</Text>
                                <Text className="text-foreground">{p.id}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-muted w-28">チャレンジID:</Text>
                                <Text className="text-foreground">{p.challengeId || "-"}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-muted w-28">ユーザーID:</Text>
                                <Text className="text-foreground">{p.userId || "-"}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-muted w-28">削除者ID:</Text>
                                <Text className="text-foreground">{p.deletedBy || "-"}</Text>
                              </View>
                              <View className="flex-row">
                                <Text className="text-muted w-28">作成日時:</Text>
                                <Text className="text-foreground">{formatDate(p.createdAt)}</Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => handleRestore(p.id)}
                              disabled={restoreMutation.isPending}
                              style={({ pressed }) => [
                                {
                                  marginTop: 12,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  backgroundColor: colors.success,
                                  opacity: pressed || restoreMutation.isPending ? 0.7 : 1,
                                },
                              ]}
                            >
                              <View className="flex-row items-center justify-center">
                                <Ionicons name="refresh" size={16} color={color.textWhite} />
                                <Text className="text-white font-medium ml-2">
                                  {restoreMutation.isPending ? "処理中..." : "この参加を復元"}
                                </Text>
                              </View>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : !error ? (
              <View className="bg-surface rounded-xl p-8 items-center border border-border">
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {commonCopy.empty.noParticipationsDeleted}
                </Text>
                <Text className="text-muted text-center mt-2">
                  ソフトデリートされた参加がここに表示されます
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* 監査ログタブ */}
        {activeTab === "audit" && (
          <>
            {isLoadingAudit ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 text-muted">読み込み中...</Text>
              </View>
            ) : auditLogs && auditLogs.length > 0 ? (
              <View className="gap-3">
                {auditLogs.map((log: AuditLog) => {
                  const actionInfo = formatAction(log.action);
                  return (
                    <View
                      key={log.id}
                      className="bg-surface rounded-xl border border-border overflow-hidden"
                    >
                      <View className="p-4">
                        <View className="flex-row items-center justify-between mb-2">
                          <View
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: actionInfo.color + "20" }}
                          >
                            <Text style={{ color: actionInfo.color, fontSize: 12, fontWeight: "600" }}>
                              {actionInfo.label}
                            </Text>
                          </View>
                          <Text className="text-xs text-muted">{formatDate(log.createdAt)}</Text>
                        </View>
                        <View className="gap-1">
                          <Text className="text-sm text-foreground">
                            対象ID: {log.targetId || "-"}
                          </Text>
                          <Text className="text-sm text-muted">
                            実行者: {log.actorName || "-"} (ID: {log.actorId || "-"})
                          </Text>
                          <Text className="text-xs text-muted font-mono">
                            requestId: {log.requestId}
                          </Text>
                        </View>
                        {(log.beforeData || log.afterData) && (
                          <View className="mt-2 pt-2 border-t border-border">
                            {log.beforeData && (
                              <Text className="text-xs text-muted">
                                Before: {JSON.stringify(log.beforeData)}
                              </Text>
                            )}
                            {log.afterData && (
                              <Text className="text-xs text-muted">
                                After: {JSON.stringify(log.afterData)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : !error ? (
              <View className="bg-surface rounded-xl p-8 items-center border border-border">
                <Ionicons name="document-text-outline" size={48} color={colors.muted} />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {commonCopy.empty.noAuditLog}
                </Text>
                <Text className="text-muted text-center mt-2">
                  参加に関する操作履歴がここに表示されます
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* 機能説明 */}
        <View className="mt-6 p-4 bg-surface rounded-xl border border-border">
          <Text className="font-semibold text-foreground mb-2">参加管理機能</Text>
          <View className="gap-2">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="text-sm text-muted ml-2">削除済み参加の一覧表示</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="text-sm text-muted ml-2">個別・一括での復元</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="text-sm text-muted ml-2">チャレンジID/ユーザーIDでフィルター</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text className="text-sm text-muted ml-2">監査ログの確認（requestId追跡）</Text>
            </View>
          </View>
        </View>

        {/* 下部の余白 */}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
