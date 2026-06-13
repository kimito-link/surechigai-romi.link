/**
 * API使用量ダッシュボード
 * 
 * Twitter APIのレート制限使用状況を可視化
 * 管理者向け機能
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { Input } from "@/components/ui/input";
import { ScreenLoadingState, ScreenErrorState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { apiGet, getErrorMessage } from "@/lib/api";
import { navigateBack } from "@/lib/navigation/app-routes";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from "react-native";

interface EndpointStats {
  requests: number;
  limit: number;
  remaining: number;
  resetAt: string;
  usagePercent: number;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  endpoints: Record<string, EndpointStats>;
  lastUpdated: number;
}

interface Warning {
  endpoint: string;
  level: "warning" | "critical";
  remaining: number;
  resetAt: string;
}

interface DashboardData {
  stats: ApiUsageStats;
  warnings: Warning[];
  recentHistory: {
    endpoint: string;
    limit: number;
    remaining: number;
    reset: number;
    timestamp: number;
  }[];
  monthlyStats?: {
    usage: number;
    cost: number;
    freeTierRemaining: number;
  };
  costLimit?: {
    exceeded: boolean;
    currentCost: number;
    limit: number;
    shouldAlert: boolean;
    shouldStop: boolean;
  };
  endpointCosts?: { endpoint: string; count: number; cost: number }[];
}

export default function ApiUsageDashboard() {
  const colors = useColors();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // コスト設定フォーム
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [autoStop, setAutoStop] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: costSettings, refetch: refetchCostSettings } = trpc.admin.getApiCostSettings.useQuery(undefined, {
    enabled: !loading && !error,
  });

  const updateCostSettingsMutation = trpc.admin.updateApiCostSettings.useMutation({
    onSuccess: () => {
      setSettingsMessage({ type: "success", text: "設定を保存しました" });
      refetchCostSettings();
      fetchData();
      setTimeout(() => setSettingsMessage(null), 3000);
    },
    onError: (err) => {
      setSettingsMessage({ type: "error", text: err.message });
    },
  });

  useEffect(() => {
    if (costSettings) {
      setMonthlyLimit(costSettings.monthlyLimit ?? "10");
      setAlertThreshold(costSettings.alertThreshold ?? "8");
      setAlertEmail(costSettings.alertEmail ?? "");
      setAutoStop(costSettings.autoStop === 1);
    }
  }, [costSettings]);

  const handleSaveCostSettings = useCallback(() => {
    const limit = parseFloat(monthlyLimit);
    const threshold = parseFloat(alertThreshold);
    if (isNaN(limit) || limit < 0) {
      setSettingsMessage({ type: "error", text: "月間上限は0以上の数値を入力してください" });
      return;
    }
    if (isNaN(threshold) || threshold < 0) {
      setSettingsMessage({ type: "error", text: "アラート閾値は0以上の数値を入力してください" });
      return;
    }
    if (alertEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail.trim())) {
      setSettingsMessage({ type: "error", text: "有効なメールアドレスを入力してください" });
      return;
    }
    updateCostSettingsMutation.mutate({
      monthlyLimit: limit,
      alertThreshold: threshold,
      alertEmail: alertEmail.trim() || null,
      autoStop,
    });
  }, [monthlyLimit, alertThreshold, alertEmail, autoStop, updateCostSettingsMutation]);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiGet<DashboardData>("/api/admin/api-usage");
      
      if (!result.ok) {
        throw new Error(getErrorMessage(result));
      }
      
      setData(result.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch API usage:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // 30秒ごとに自動更新
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getWarningColor = (level: "warning" | "critical") => {
    return level === "critical" ? colors.error : colors.warning;
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return colors.error;
    if (percent >= 70) return colors.warning;
    return colors.success;
  };

  if (loading) {
    return <ScreenLoadingState />;
  }

  if (error) {
    return (
      <ScreenErrorState
        errorMessage={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              API使用量ダッシュボード
            </Text>
            <Text className="text-sm text-muted mt-1">
              Twitter API レート制限の監視
            </Text>
          </View>
          <Pressable
            onPress={() => navigateBack()}
            style={({ pressed }) => [
              {
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text className="text-primary">閉じる</Text>
          </Pressable>
        </View>

        {/* 警告セクション */}
        {data?.warnings && data.warnings.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              ⚠️ 警告
            </Text>
            {data.warnings.map((warning, index) => (
              <View
                key={index}
                className="p-4 rounded-lg mb-2"
                style={{ backgroundColor: getWarningColor(warning.level) + "20" }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="font-semibold"
                    style={{ color: getWarningColor(warning.level) }}
                  >
                    {warning.level === "critical" ? "🔴 危険" : "🟡 注意"}
                  </Text>
                  <Text className="text-sm text-muted">
                    残り {warning.remaining} 回
                  </Text>
                </View>
                <Text className="text-foreground mt-1">{warning.endpoint}</Text>
                <Text className="text-sm text-muted mt-1">
                  リセット: {new Date(warning.resetAt).toLocaleString("ja-JP")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 統計サマリー */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            📊 統計サマリー
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[140px] bg-surface p-4 rounded-lg">
              <Text className="text-3xl font-bold text-foreground">
                {data?.stats.totalRequests || 0}
              </Text>
              <Text className="text-sm text-muted">総リクエスト数</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface p-4 rounded-lg">
              <Text className="text-3xl font-bold text-success">
                {data?.stats.successfulRequests || 0}
              </Text>
              <Text className="text-sm text-muted">成功</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface p-4 rounded-lg">
              <Text className="text-3xl font-bold text-error">
                {data?.stats.rateLimitedRequests || 0}
              </Text>
              <Text className="text-sm text-muted">レート制限</Text>
            </View>
          </View>
        </View>

        {/* コスト情報 */}
        {data?.monthlyStats && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              💰 今月のコスト
            </Text>
            <View className="bg-surface p-4 rounded-lg mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-semibold">使用量</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {data.monthlyStats.usage} 件
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-muted">無料枠残り</Text>
                <Text
                  className={`font-semibold ${
                    data.monthlyStats.freeTierRemaining > 0
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {data.monthlyStats.freeTierRemaining} 件
                </Text>
              </View>
              <View className="h-1 bg-border rounded-full overflow-hidden my-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (data.monthlyStats.usage / 100) * 100)}%`,
                    backgroundColor:
                      data.monthlyStats.usage >= 100
                        ? colors.error
                        : data.monthlyStats.usage >= 80
                        ? colors.warning
                        : colors.success,
                  }}
                />
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-foreground font-semibold">推定コスト</Text>
                <Text
                  className={`text-2xl font-bold ${
                    data.monthlyStats.cost > 0 ? "text-error" : "text-success"
                  }`}
                >
                  ${data.monthlyStats.cost.toFixed(2)}
                </Text>
              </View>
              {data.costLimit && (
                <>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-muted">コスト上限</Text>
                    <Text className="text-muted">${data.costLimit.limit.toFixed(2)}</Text>
                  </View>
                  {data.costLimit.exceeded && (
                    <View
                      className="mt-3 p-3 rounded-lg"
                      style={{ backgroundColor: colors.error + "20" }}
                    >
                      <Text className="text-error font-semibold">
                        ⚠️ コスト上限を超過しました
                      </Text>
                      {data.costLimit.shouldStop && (
                        <Text className="text-error text-sm mt-1">
                          API呼び出しが自動停止されています
                        </Text>
                      )}
                    </View>
                  )}
                  {data.costLimit.shouldAlert && !data.costLimit.exceeded && (
                    <View
                      className="mt-3 p-3 rounded-lg"
                      style={{ backgroundColor: colors.warning + "20" }}
                    >
                      <Text className="text-warning font-semibold">
                        ⚠️ コスト上限に近づいています
                      </Text>
                      <Text className="text-warning text-sm mt-1">
                        現在: ${data.costLimit.currentCost.toFixed(2)} / 上限: ${data.costLimit.limit.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* コスト設定フォーム */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            ⚙️ コスト設定
          </Text>
          <View className="bg-surface p-4 rounded-lg">
            <View className="mb-3">
              <Input
                label="月間コスト上限 (USD)"
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
                placeholder="10"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="mb-3">
              <Input
                label="アラート閾値 (USD)"
                value={alertThreshold}
                onChangeText={setAlertThreshold}
                placeholder="8"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="mb-3">
              <Input
                label="アラート送信先メール"
                value={alertEmail}
                onChangeText={setAlertEmail}
                placeholder="info@best-trust.biz"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm text-foreground">上限到達時にAPI呼び出しを自動停止</Text>
              <Switch
                value={autoStop}
                onValueChange={setAutoStop}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={color.textWhite}
              />
            </View>
            {settingsMessage && (
              <View
                className="p-2 rounded mb-3"
                style={{
                  backgroundColor:
                    settingsMessage.type === "success" ? colors.success + "20" : colors.error + "20",
                }}
              >
                <Text
                  style={{
                    color: settingsMessage.type === "success" ? colors.success : colors.error,
                    fontSize: 14,
                  }}
                >
                  {settingsMessage.text}
                </Text>
              </View>
            )}
            <Pressable
              onPress={handleSaveCostSettings}
              disabled={updateCostSettingsMutation.isPending}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: pressed || updateCostSettingsMutation.isPending ? 0.7 : 1,
                },
              ]}
            >
              {updateCostSettingsMutation.isPending ? (
                <ActivityIndicator size="small" color={color.textWhite} />
              ) : (
                <Text className="text-white font-semibold">設定を保存</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* エンドポイント別統計 */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            🔗 エンドポイント別（今月の累計）
          </Text>
          {data?.endpointCosts && data.endpointCosts.length > 0 ? (
            data.endpointCosts.map((item) => (
              <View
                key={item.endpoint}
                className="bg-surface p-4 rounded-lg mb-3"
              >
                <Text className="font-semibold text-foreground mb-2">
                  {item.endpoint}
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted">
                    リクエスト: {item.count} 件
                  </Text>
                  <Text className={`text-sm font-semibold ${
                    item.cost > 0 ? "text-error" : "text-success"
                  }`}>
                    コスト: ${item.cost.toFixed(4)}
                  </Text>
                </View>
                {/* コストバー */}
                {data.monthlyStats && data.monthlyStats.cost > 0 && (
                  <View className="h-2 bg-border rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.cost / data.monthlyStats.cost) * 100)}%`,
                        backgroundColor: colors.error,
                      }}
                    />
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className="bg-surface p-4 rounded-lg">
              <Text className="text-muted text-center">
                {commonCopy.empty.noApiRequests}
              </Text>
            </View>
          )}
        </View>

        {/* エンドポイント別レート制限統計 */}
        {data?.stats.endpoints && Object.keys(data.stats.endpoints).length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              📊 エンドポイント別レート制限状況
            </Text>
            {Object.entries(data.stats.endpoints).map(([endpoint, stats]) => (
              <View
                key={endpoint}
                className="bg-surface p-4 rounded-lg mb-3"
              >
                <Text className="font-semibold text-foreground mb-2">
                  {endpoint}
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted">
                    リクエスト: {stats.requests}
                  </Text>
                  <Text className="text-sm text-muted">
                    残り: {stats.remaining}/{stats.limit}
                  </Text>
                </View>
                {/* プログレスバー */}
                <View className="h-2 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${stats.usagePercent}%`,
                      backgroundColor: getUsageColor(stats.usagePercent),
                    }}
                  />
                </View>
                <Text className="text-xs text-muted mt-1">
                  使用率: {stats.usagePercent}% | リセット:{" "}
                  {new Date(stats.resetAt).toLocaleString("ja-JP")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 最終更新時刻 */}
        <Text className="text-xs text-muted text-center">
          最終更新:{" "}
          {data?.stats.lastUpdated
            ? new Date(data.stats.lastUpdated).toLocaleString("ja-JP")
            : "-"}
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
