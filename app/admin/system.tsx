/**
 * システム状態確認画面
 * 
 * データベース接続、API状況、環境変数などを確認
 */

import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { apiGet, getErrorMessage } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getVersionInfo } from "@/shared/version";

interface HealthResponse {
  ok: boolean;
  timestamp: number;
  version: string;
  gitSha: string;
  builtAt: string;
  nodeEnv: string;
}

interface SystemStatus {
  database: {
    connected: boolean;
    latency?: number;
    error?: string;
  };
  twitter: {
    configured: boolean;
    rateLimitRemaining?: number;
    error?: string;
  };
  server: {
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
    nodeVersion: string;
  };
  environment: {
    name: string;
    masked: string;
    configured: boolean;
  }[];
}

export default function SystemStatusScreen() {
  const colors = useColors();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フロントエンドバージョン
  const frontendVersion = getVersionInfo();

  const fetchStatus = useCallback(async () => {
    try {
      // /api/healthを取得（バージョン確認用）
      const healthResult = await apiGet<HealthResponse>("/api/health");
      if (healthResult.ok) {
        setHealth(healthResult.data);
      }
      
      const result = await apiGet<SystemStatus>("/api/admin/system-status");
      
      if (!result.ok) {
        throw new Error(getErrorMessage(result));
      }
      
      setStatus(result.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch system status:", err);
      setError(err instanceof Error ? err.message : "データの取得に失敗しました");
      
      // フォールバック: 基本的な情報を表示
      setStatus({
        database: { connected: false, error: "接続状態を確認できません" },
        twitter: { configured: false, error: "設定状態を確認できません" },
        server: {
          uptime: 0,
          memory: { used: 0, total: 0 },
          nodeVersion: "unknown",
        },
        environment: [
          { name: "DATABASE_URL", masked: "***", configured: true },
          { name: "TWITTER_CLIENT_ID", masked: "***", configured: true },
          { name: "TWITTER_CLIENT_SECRET", masked: "***", configured: true },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [fetchStatus]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}日 ${hours}時間`;
    if (hours > 0) return `${hours}時間 ${minutes}分`;
    return `${minutes}分`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">システム状態を確認中...</Text>
      </ScreenContainer>
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
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">システム状態</Text>
          <Text className="text-sm text-muted mt-1">
            データベース、API、サーバーの状態を確認
          </Text>
        </View>

        {/* バージョン情報（デプロイ確認用） */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="git-branch-outline" size={24} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              バージョン情報
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">フロントエンド</Text>
            <Text className="text-foreground font-mono">v{frontendVersion.version}</Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">バックエンド</Text>
            <Text className="text-foreground font-mono">v{health?.version ?? "loading..."}</Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">Git SHA</Text>
            <Text className="text-foreground font-mono text-xs">
              {health?.gitSha?.substring(0, 7) ?? "loading..."}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">ビルド日時</Text>
            <Text className="text-foreground text-sm">
              {health?.builtAt ?? "loading..."}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-muted">環境</Text>
            <Text className="text-foreground">{health?.nodeEnv ?? "loading..."}</Text>
          </View>
          
          {/* バージョン不一致警告 */}
          {health && health.version !== "unknown" && health.version !== frontendVersion.version && (
            <View
              className="mt-3 p-3 rounded-lg"
              style={{ backgroundColor: colors.warning + "20" }}
            >
              <Text style={{ color: colors.warning }} className="font-semibold">
                ⚠️ バージョン不一致
              </Text>
              <Text style={{ color: colors.warning }} className="text-sm mt-1">
                フロント: v{frontendVersion.version} / バックエンド: v{health.version}
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: colors.warning + "20" }}
          >
            <Text style={{ color: colors.warning }}>⚠️ {error}</Text>
          </View>
        )}

        {/* データベース接続 */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="server-outline" size={24} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              データベース
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">接続状態</Text>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: status?.database.connected
                    ? colors.success
                    : colors.error,
                }}
              />
              <Text
                style={{
                  color: status?.database.connected ? colors.success : colors.error,
                }}
              >
                {status?.database.connected ? "接続中" : "未接続"}
              </Text>
            </View>
          </View>
          
          {status?.database.latency !== undefined && (
            <View className="flex-row items-center justify-between py-2 border-b border-border">
              <Text className="text-muted">レイテンシ</Text>
              <Text className="text-foreground">{status.database.latency}ms</Text>
            </View>
          )}
          
          {status?.database.error && (
            <View className="py-2">
              <Text className="text-error text-sm">{status.database.error}</Text>
            </View>
          )}
        </View>

        {/* Twitter API */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="logo-twitter" size={24} color={color.twitter} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              Twitter API
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">設定状態</Text>
            <View className="flex-row items-center">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: status?.twitter.configured
                    ? colors.success
                    : colors.warning,
                }}
              />
              <Text
                style={{
                  color: status?.twitter.configured ? colors.success : colors.warning,
                }}
              >
                {status?.twitter.configured ? "設定済み" : "未設定"}
              </Text>
            </View>
          </View>
          
          {status?.twitter.rateLimitRemaining !== undefined && (
            <View className="flex-row items-center justify-between py-2 border-b border-border">
              <Text className="text-muted">レート制限残り</Text>
              <Text className="text-foreground">
                {status.twitter.rateLimitRemaining} リクエスト
              </Text>
            </View>
          )}
          
          {status?.twitter.error && (
            <View className="py-2">
              <Text className="text-error text-sm">{status.twitter.error}</Text>
            </View>
          )}
        </View>

        {/* サーバー情報 */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="hardware-chip-outline" size={24} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              サーバー情報
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">稼働時間</Text>
            <Text className="text-foreground">
              {formatUptime(status?.server.uptime ?? 0)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-muted">メモリ使用量</Text>
            <Text className="text-foreground">
              {formatBytes(status?.server.memory.used ?? 0)} /{" "}
              {formatBytes(status?.server.memory.total ?? 0)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-muted">Node.js バージョン</Text>
            <Text className="text-foreground">{status?.server.nodeVersion ?? "-"}</Text>
          </View>
        </View>

        {/* 環境変数 */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="key-outline" size={24} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">
              環境変数
            </Text>
          </View>
          
          {status?.environment.map((env, index) => (
            <View
              key={env.name}
              className="flex-row items-center justify-between py-2"
              style={{
                borderBottomWidth: index < (status?.environment.length ?? 0) - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text className="text-muted font-mono text-sm">{env.name}</Text>
              <View className="flex-row items-center">
                <Text className="text-foreground mr-2">{env.masked}</Text>
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: env.configured ? colors.success : colors.error,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* 更新ボタン */}
        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text className="text-white font-semibold">状態を更新</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
