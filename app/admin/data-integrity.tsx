/**
 * データ整合性ダッシュボード
 * 
 * チャレンジの数字（currentValue）と実際の参加者数の
 * 整合性を確認・修復できる管理者向け画面
 */

import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { RefreshingIndicator } from "@/components/molecules/refreshing-indicator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { APP_VERSION } from "@/shared/version";
import {
  StatCard,
  DataIntegrityChallengeCard,
} from "./components/index";

export default function DataIntegrityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  // データ整合性レポートを取得
  const { data: report, isLoading, isFetching, refetch } = trpc.admin.getDataIntegrityReport.useQuery();
  
  // ローディング状態を分離
  const hasData = !!report;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isFetching && hasData;
  
  // 再計算mutation
  const recalculateMutation = trpc.admin.recalculateCurrentValues.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  
  const handleRecalculate = () => {
    if (confirm("全チャレンジのcurrentValueを再計算しますか？\n\nこの操作は参加者テーブルから実際の数を集計し、currentValueを更新します。")) {
      recalculateMutation.mutate();
    }
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">データを読み込み中...</Text>
      </View>
    );
  }

  const challenges = report?.challenges || [];
  const totalChallenges = report?.totalChallenges || 0;
  const challengesWithDiscrepancy = report?.challengesWithDiscrepancy || 0;
  const hasDiscrepancies = challengesWithDiscrepancy > 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {isRefreshing && <RefreshingIndicator isRefreshing={isRefreshing} />}
      <View className="p-6">
        {/* ヘッダー */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">データ整合性ダッシュボード</Text>
          <Text className="text-muted mt-1">v{APP_VERSION} - 数字の整合性確認・修復</Text>
        </View>

        {/* サマリーカード */}
        {report && (
          <View className="bg-surface rounded-xl p-4 mb-6 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">📊 サマリー</Text>
            
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <StatCard 
                label="総チャレンジ数" 
                value={totalChallenges} 
                color={colors.foreground} 
              />
              <StatCard 
                label="不整合あり" 
                value={challengesWithDiscrepancy} 
                color={challengesWithDiscrepancy > 0 ? colors.error : colors.success}
                icon={challengesWithDiscrepancy > 0 ? "warning" : "checkmark-circle"}
              />
              <StatCard 
                label="保存値合計" 
                value={challenges.reduce((sum, c) => sum + c.storedCurrentValue, 0)} 
                color={colors.muted} 
              />
              <StatCard 
                label="実際値合計" 
                value={challenges.reduce((sum, c) => sum + c.actualTotalContribution, 0)} 
                color={colors.primary} 
              />
              <StatCard 
                label="差分合計" 
                value={challenges.reduce((sum, c) => sum + c.discrepancyAmount, 0)} 
                color={challenges.reduce((sum, c) => sum + c.discrepancyAmount, 0) !== 0 ? colors.warning : colors.success}
                showSign
              />
            </View>
          </View>
        )}

        {/* アクションボタン */}
        {hasDiscrepancies && (
          <View className="mb-6">
            <Pressable
              onPress={handleRecalculate}
              disabled={recalculateMutation.isPending}
              style={({ pressed }) => [
                styles.actionButton,
                { 
                  backgroundColor: colors.warning, 
                  opacity: pressed || recalculateMutation.isPending ? 0.7 : 1 
                }
              ]}
            >
              {recalculateMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="refresh" size={20} color="white" />
              )}
              <Text className="text-white font-semibold ml-2">
                {recalculateMutation.isPending ? "修復中..." : "不整合を一括修復"}
              </Text>
            </Pressable>
            
            {recalculateMutation.isSuccess && (
              <View className="mt-3 p-3 bg-success/20 rounded-lg">
                <Text className="text-success font-medium">
                  ✓ {recalculateMutation.data?.fixedCount}件のチャレンジを修復しました
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 整合性ステータス */}
        {!hasDiscrepancies && report && (
          <View className="mb-6 p-4 bg-success/20 rounded-xl border border-success/30">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text className="text-success font-semibold ml-2">
                すべてのデータが整合しています
              </Text>
            </View>
          </View>
        )}

        {/* チャレンジ一覧 */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">📋 チャレンジ詳細</Text>
          
          {challenges.map((challenge) => (
            <DataIntegrityChallengeCard
              key={challenge.id}
              challenge={challenge}
              colors={colors}
            />
          ))}
        </View>

        {/* フッター */}
        <View className="mt-8 pt-6 border-t border-border">
          <Text className="text-xs text-muted text-center">
            データ整合性ダッシュボード v{APP_VERSION}
          </Text>
          <Text className="text-xs text-muted text-center mt-1">
            参加登録時にcurrentValueが自動更新されます
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
