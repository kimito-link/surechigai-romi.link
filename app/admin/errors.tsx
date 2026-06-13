/**
 * エラーログ閲覧画面
 * 
 * アプリケーションで発生したエラーを確認・管理
 * AI分析結果も表示
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { ScreenLoadingState } from "@/components/ui";
import { commonCopy } from "@/constants/copy/common";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AiAnalysis {
  cause: string;
  solution: string;
  codeExample?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  confidence: number;
  model: string;
  analyzedAt: string;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  category: "database" | "api" | "auth" | "twitter" | "validation" | "unknown";
  message: string;
  stack?: string;
  context?: {
    endpoint?: string;
    method?: string;
    userId?: number;
    requestBody?: any;
    query?: any;
  };
  resolved: boolean;
  aiAnalysis?: AiAnalysis;
  aiAnalyzing?: boolean;
}

interface ErrorStats {
  total: number;
  unresolved: number;
  byCategory: Record<string, number>;
  recentErrors: number;
}

const categoryLabels: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  database: { label: "データベース", icon: "server-outline", color: color.danger },
  api: { label: "API", icon: "cloud-outline", color: color.warning },
  auth: { label: "認証", icon: "lock-closed-outline", color: color.accentAlt },
  twitter: { label: "Twitter", icon: "logo-twitter", color: color.twitter },
  validation: { label: "バリデーション", icon: "alert-circle-outline", color: color.accentPrimary },
  unknown: { label: "その他", icon: "help-circle-outline", color: color.textSubtle },
};

const severityColors: Record<string, string> = {
  low: color.success,
  medium: color.warning,
  high: color.danger,
  critical: color.danger,
};

const severityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "緊急",
};

export default function ErrorLogsScreen() {
  const colors = useColors();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (!showResolved) params.append("resolved", "false");
      
      const result = await apiGet<{ logs: ErrorLog[]; stats: ErrorStats }>(
        `/api/admin/errors?${params.toString()}`
      );
      
      if (result.ok && result.data) {
        setLogs(result.data.logs);
        setStats(result.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch error logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, showResolved]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 定期的に更新（AI分析結果を取得するため）
  useEffect(() => {
    const interval = setInterval(() => {
      if (logs.some(log => log.aiAnalyzing)) {
        fetchLogs();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [logs, fetchLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleResolve = async (errorId: string) => {
    try {
      const result = await apiPost(`/api/admin/errors/${errorId}/resolve`, {});
      if (result.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to resolve error:", err);
    }
  };

  const handleResolveAll = async () => {
    const confirm = Platform.OS === "web"
      ? window.confirm("すべてのエラーを解決済みにしますか？")
      : true;
    
    if (Platform.OS !== "web") {
      Alert.alert(
        commonCopy.alerts.confirm,
        "すべてのエラーを解決済みにしますか？",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "解決済みにする",
            onPress: async () => {
              const result = await apiPost("/api/admin/errors/resolve-all", {});
              if (result.ok) {
                fetchLogs();
              }
            },
          },
        ]
      );
      return;
    }
    
    if (confirm) {
      const result = await apiPost("/api/admin/errors/resolve-all", {});
      if (result.ok) {
        fetchLogs();
      }
    }
  };

  const handleClearAll = async () => {
    const confirm = Platform.OS === "web"
      ? window.confirm("すべてのエラーログを削除しますか？この操作は取り消せません。")
      : true;
    
    if (Platform.OS !== "web") {
      Alert.alert(
        commonCopy.alerts.confirm,
        "すべてのエラーログを削除しますか？この操作は取り消せません。",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: async () => {
              const result = await apiDelete("/api/admin/errors");
              if (result.ok) {
                fetchLogs();
              }
            },
          },
        ]
      );
      return;
    }
    
    if (confirm) {
      const result = await apiDelete("/api/admin/errors");
      if (result.ok) {
        fetchLogs();
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return <ScreenLoadingState message={commonCopy.loading.errors} />;
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
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">エラーログ</Text>
          <Text className="text-sm text-muted mt-1">
            アプリケーションで発生したエラーを確認（AI分析付き）
          </Text>
        </View>

        {/* 統計サマリー */}
        {stats && (
          <View className="flex-row flex-wrap gap-3 mb-6">
            <View className="flex-1 min-w-[100px] bg-surface p-4 rounded-lg border border-border">
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
              <Text className="text-xs text-muted">総エラー数</Text>
            </View>
            <View className="flex-1 min-w-[100px] bg-surface p-4 rounded-lg border border-border">
              <Text className="text-2xl font-bold text-error">{stats.unresolved}</Text>
              <Text className="text-xs text-muted">未解決</Text>
            </View>
            <View className="flex-1 min-w-[100px] bg-surface p-4 rounded-lg border border-border">
              <Text className="text-2xl font-bold text-warning">{stats.recentErrors}</Text>
              <Text className="text-xs text-muted">直近1時間</Text>
            </View>
          </View>
        )}

        {/* カテゴリフィルター */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: !selectedCategory ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: !selectedCategory ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ color: !selectedCategory ? color.textWhite : colors.foreground }}>
                  すべて
                </Text>
              </Pressable>
              {Object.entries(categoryLabels).map(([key, { label, color: categoryColor }]) => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedCategory(key)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: selectedCategory === key ? categoryColor : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedCategory === key ? categoryColor : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: selectedCategory === key ? color.textWhite : colors.foreground }}>
                    {label} {stats?.byCategory[key] ? `(${stats.byCategory[key]})` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* オプション */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => setShowResolved(!showResolved)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons
              name={showResolved ? "checkbox" : "square-outline"}
              size={20}
              color={colors.primary}
            />
            <Text className="ml-2 text-foreground">解決済みも表示</Text>
          </Pressable>
          
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleResolveAll}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.success + "20",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: colors.success, fontSize: 12 }}>すべて解決</Text>
            </Pressable>
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: colors.error + "20",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: colors.error, fontSize: 12 }}>すべて削除</Text>
            </Pressable>
          </View>
        </View>

        {/* エラーリスト */}
        {logs.length === 0 ? (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text className="text-lg font-semibold text-foreground mt-4">
              {commonCopy.empty.noErrors}
            </Text>
            <Text className="text-muted text-center mt-2">
              システムは正常に動作しています
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {logs.map((log) => {
              const category = categoryLabels[log.category] || categoryLabels.unknown;
              const isExpanded = expandedId === log.id;
              
              return (
                <Pressable
                  key={log.id}
                  onPress={() => setExpandedId(isExpanded ? null : log.id)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: log.resolved ? colors.border : category.color + "40",
                    borderLeftWidth: 4,
                    borderLeftColor: category.color,
                    opacity: pressed ? 0.95 : log.resolved ? 0.7 : 1,
                  })}
                >
                  <View className="p-4">
                    {/* ヘッダー */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-wrap gap-2">
                        <View className="flex-row items-center">
                          <Ionicons name={category.icon} size={16} color={category.color} />
                          <Text
                            className="ml-1 text-xs font-medium"
                            style={{ color: category.color }}
                          >
                            {category.label}
                          </Text>
                        </View>
                        {log.resolved && (
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: colors.success + "20" }}
                          >
                            <Text className="text-xs" style={{ color: colors.success }}>
                              解決済み
                            </Text>
                          </View>
                        )}
                        {log.aiAnalysis && (
                          <View
                            className="px-2 py-0.5 rounded flex-row items-center"
                            style={{ backgroundColor: severityColors[log.aiAnalysis.severity] + "20" }}
                          >
                            <Ionicons name="sparkles" size={10} color={severityColors[log.aiAnalysis.severity]} />
                            <Text className="text-xs ml-1" style={{ color: severityColors[log.aiAnalysis.severity] }}>
                              AI分析済み
                            </Text>
                          </View>
                        )}
                        {log.aiAnalyzing && (
                          <View
                            className="px-2 py-0.5 rounded flex-row items-center"
                            style={{ backgroundColor: colors.primary + "20" }}
                          >
                            <ActivityIndicator size={10} color={colors.primary} />
                            <Text className="text-xs ml-1" style={{ color: colors.primary }}>
                              分析中...
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-muted">{formatDate(log.timestamp)}</Text>
                    </View>

                    {/* メッセージ */}
                    <Text
                      className="text-foreground"
                      numberOfLines={isExpanded ? undefined : 2}
                    >
                      {log.message}
                    </Text>

                    {/* コンテキスト */}
                    {log.context?.endpoint && (
                      <Text className="text-xs text-muted mt-2">
                        {log.context.method || "GET"} {log.context.endpoint}
                      </Text>
                    )}

                    {/* AI分析結果のサマリー（折りたたみ時） */}
                    {!isExpanded && log.aiAnalysis && (
                      <View 
                        className="mt-3 p-3 rounded-lg"
                        style={{ backgroundColor: severityColors[log.aiAnalysis.severity] + "10" }}
                      >
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="sparkles" size={14} color={severityColors[log.aiAnalysis.severity]} />
                          <Text className="text-xs font-semibold ml-1" style={{ color: severityColors[log.aiAnalysis.severity] }}>
                            AI分析: {severityLabels[log.aiAnalysis.severity]}レベル（確信度 {log.aiAnalysis.confidence}%）
                          </Text>
                        </View>
                        <Text className="text-sm text-foreground" numberOfLines={2}>
                          {log.aiAnalysis.cause}
                        </Text>
                      </View>
                    )}

                    {/* 展開時の詳細 */}
                    {isExpanded && (
                      <View className="mt-4 pt-4 border-t border-border">
                        {/* AI分析結果 */}
                        {log.aiAnalysis && (
                          <View 
                            className="mb-4 p-4 rounded-lg"
                            style={{ backgroundColor: severityColors[log.aiAnalysis.severity] + "10" }}
                          >
                            <View className="flex-row items-center justify-between mb-3">
                              <View className="flex-row items-center">
                                <Ionicons name="sparkles" size={18} color={severityColors[log.aiAnalysis.severity]} />
                                <Text className="text-base font-bold ml-2" style={{ color: severityColors[log.aiAnalysis.severity] }}>
                                  AI分析結果
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-2">
                                <View 
                                  className="px-2 py-1 rounded"
                                  style={{ backgroundColor: severityColors[log.aiAnalysis.severity] + "30" }}
                                >
                                  <Text className="text-xs font-medium" style={{ color: severityColors[log.aiAnalysis.severity] }}>
                                    {severityLabels[log.aiAnalysis.severity]}
                                  </Text>
                                </View>
                                <Text className="text-xs text-muted">
                                  確信度 {log.aiAnalysis.confidence}%
                                </Text>
                              </View>
                            </View>

                            {/* 原因 */}
                            <View className="mb-3">
                              <Text className="text-xs font-semibold text-muted mb-1">
                                🔍 原因
                              </Text>
                              <Text className="text-foreground">
                                {log.aiAnalysis.cause}
                              </Text>
                            </View>

                            {/* 解決策 */}
                            <View className="mb-3">
                              <Text className="text-xs font-semibold text-muted mb-1">
                                💡 解決策
                              </Text>
                              <Text className="text-foreground">
                                {log.aiAnalysis.solution}
                              </Text>
                            </View>

                            {/* コード例 */}
                            {log.aiAnalysis.codeExample && (
                              <View className="mb-3">
                                <Text className="text-xs font-semibold text-muted mb-1">
                                  📝 コード例
                                </Text>
                                <View 
                                  className="p-3 rounded"
                                  style={{ backgroundColor: colors.background }}
                                >
                                  <Text className="text-xs font-mono text-foreground">
                                    {log.aiAnalysis.codeExample}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* メタ情報 */}
                            <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
                              <Text className="text-xs text-muted">
                                モデル: {log.aiAnalysis.model}
                              </Text>
                              <Text className="text-xs text-muted">
                                {formatDate(log.aiAnalysis.analyzedAt)}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* AI分析中 */}
                        {log.aiAnalyzing && (
                          <View 
                            className="mb-4 p-4 rounded-lg items-center"
                            style={{ backgroundColor: colors.primary + "10" }}
                          >
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text className="text-sm text-muted mt-2">
                              AIがエラーを分析中...
                            </Text>
                          </View>
                        )}

                        {/* スタックトレース */}
                        {log.stack && (
                          <View className="mb-4">
                            <Text className="text-xs font-semibold text-muted mb-1">
                              スタックトレース
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={true}
                            >
                              <Text
                                className="text-xs font-mono text-muted"
                                style={{ maxWidth: 600 }}
                              >
                                {log.stack}
                              </Text>
                            </ScrollView>
                          </View>
                        )}

                        {/* リクエスト情報 */}
                        {log.context && (
                          <View className="mb-4">
                            <Text className="text-xs font-semibold text-muted mb-1">
                              リクエスト情報
                            </Text>
                            <Text className="text-xs font-mono text-muted">
                              {JSON.stringify(log.context, null, 2)}
                            </Text>
                          </View>
                        )}

                        {/* アクション */}
                        {!log.resolved && (
                          <Pressable
                            onPress={() => handleResolve(log.id)}
                            style={({ pressed }) => ({
                              backgroundColor: colors.success,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: "center",
                              opacity: pressed ? 0.8 : 1,
                            })}
                          >
                            <Text className="text-white font-semibold">解決済みにする</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AI分析の説明 */}
        <View className="mt-6 p-4 bg-surface rounded-xl border border-border">
          <View className="flex-row items-center mb-2">
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text className="font-semibold text-foreground ml-2">
              AI自動分析について
            </Text>
          </View>
          <Text className="text-sm text-muted">
            エラーが発生すると、AIが自動的に原因を分析し、解決策を提案します。
            OpenRouterの無料モデル（Llama、Mistral等）を使用しています。
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.low }} />
              <Text className="text-xs text-muted ml-1">低</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.medium }} />
              <Text className="text-xs text-muted ml-1">中</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.high }} />
              <Text className="text-xs text-muted ml-1">高</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColors.critical }} />
              <Text className="text-xs text-muted ml-1">緊急</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
