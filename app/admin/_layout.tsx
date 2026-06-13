/**
 * 管理画面レイアウト
 * 
 * サイドバー付きの管理画面専用レイアウト
 * 管理者のみアクセス可能
 */

import { Stack, usePathname } from "expo-router";
import { commonCopy } from "@/constants/copy/common";
import { navigate, navigateReplace } from "@/lib/navigation";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/theme/tokens";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAdminSession, setAdminSession } from "@/lib/admin-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiCall } from "@/lib/_core/api";

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: "dashboard", label: "ダッシュボード", icon: "grid-outline", path: "/admin" },
  { id: "system", label: "システム状態", icon: "server-outline", path: "/admin/system" },
  { id: "data-integrity", label: "データ整合性", icon: "checkmark-done-circle-outline", path: "/admin/data-integrity" },
  { id: "errors", label: "エラーログ", icon: "bug-outline", path: "/admin/errors" },
  { id: "categories", label: "カテゴリ管理", icon: "pricetags-outline", path: "/admin/categories" },
  { id: "challenges", label: "チャレンジ管理", icon: "trophy-outline", path: "/admin/challenges" },
  { id: "users", label: "ユーザー管理", icon: "people-outline", path: "/admin/users" },
  { id: "api-usage", label: "API使用量", icon: "analytics-outline", path: "/admin/api-usage" },
  { id: "release-notes", label: "リリースノート", icon: "document-text-outline", path: "/admin/release-notes" },
  { id: "components", label: "コンポーネント", icon: "cube-outline", path: "/admin/component-gallery" },
  { id: "participations", label: "参加管理", icon: "chatbubbles-outline", path: "/admin/participations" },
];

// 管理パスワードは環境変数からのみ取得（ハードコード禁止: BUG-003修正）

export default function AdminLayout() {
  const colors = useColors();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(Platform.OS === "web");
  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // 管理者セッションをチェック（Web/Nativeで確実に判定）
  useEffect(() => {
    let isMounted = true;
    
    const checkAdminSession = async () => {
      let session = false;
      try {
        // Web環境ではlocalStorageを同期的にチェック
        if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
          try {
            const sessionData = window.localStorage.getItem("admin_session");
            if (sessionData) {
              const parsedSession = JSON.parse(sessionData);
              // 有効期限チェック
              if (parsedSession.expiry && Date.now() > parsedSession.expiry) {
                window.localStorage.removeItem("admin_session");
              } else {
                session = parsedSession.authenticated === true;
              }
            }
          } catch {
            session = false;
          }
        } else if (Platform.OS !== "web") {
          // Native環境
          session = await getAdminSession();
        }
      } catch {
        session = false;
      } finally {
        if (isMounted) {
          setHasAdminSession(session);
          setIsCheckingSession(false);
        }
      }
    };
    
    // 即座にセッションチェックを開始
    checkAdminSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // パスワード認証
  const handlePasswordSubmit = async () => {
    try {
      // サーバー側でパスワードを検証
      const result = await apiCall<{ success: boolean; error?: string }>(
        "/api/admin/verify-password",
        {
          method: "POST",
          body: JSON.stringify({ password }),
        }
      );

      if (result.success) {
        // クライアント側のセッションも保存
        await setAdminSession();
        setHasAdminSession(true);
        setPasswordError("");
        setPassword("");
      } else {
        setPasswordError(result.error || commonCopy.empty.passwordIncorrect);
      }
    } catch (error) {
      console.error("[Admin] Password verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "認証に失敗しました";
      setPasswordError(errorMessage);
    }
  };

  // ローディング中（タイムアウト付き）
  // useAuthのloadingが長く続く場合でも、セッションチェックが完了したらパスワード画面を表示
  if (isCheckingSession) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">読み込み中...</Text>
      </View>
    );
  }

  // 管理者権限チェック（role: admin または パスワード認証済み）
  const isAdmin = user?.role === "admin" || hasAdminSession;
  
  // パスワード認証画面（管理者権限がない場合）
  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Ionicons name="lock-closed" size={64} color={colors.muted} />
        <Text className="text-xl font-bold text-foreground mt-4">管理者認証</Text>
        <Text className="text-muted text-center mt-2 mb-6">
          管理画面にアクセスするにはパスワードが必要です
        </Text>
        
        <View style={{ width: "100%", maxWidth: 400, gap: 16 }}>
          <Input
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
            placeholder="パスワードを入力"
            secureTextEntry
            error={passwordError}
            onSubmitEditing={handlePasswordSubmit}
          />
          
          <Button
            onPress={handlePasswordSubmit}
            variant="primary"
            fullWidth
            disabled={!password.trim()}
          >
            認証
          </Button>
          
          {user && (
            <Pressable
              onPress={() => navigateReplace.toHomeRoot()}
              style={({ pressed }) => ({
                paddingVertical: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text className="text-muted text-center">ホームに戻る</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    return pathname.startsWith(path);
  };

  return (
    <View className="flex-1 flex-row bg-background">
      {/* サイドバー（PC/タブレット） */}
      {sidebarOpen && (
        <View
          className="bg-surface border-r border-border"
          style={{
            width: 260,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          {/* ヘッダー */}
          <View className="p-4 border-b border-border">
            <Text className="text-lg font-bold text-foreground">管理画面</Text>
            <Text className="text-xs text-muted mt-1">動員ちゃれんじ Admin</Text>
          </View>

          {/* メニュー */}
          <ScrollView className="flex-1">
            <View className="p-2">
              {menuItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => navigate.toAdminPath(item.path)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 4,
                    backgroundColor: isActive(item.path)
                      ? colors.primary + "20"
                      : pressed
                      ? colors.border
                      : "transparent",
                  })}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive(item.path) ? colors.primary : colors.muted}
                  />
                  <Text
                    className="ml-3"
                    style={{
                      color: isActive(item.path) ? colors.primary : colors.foreground,
                      fontWeight: isActive(item.path) ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* フッター */}
          <View className="p-4 border-t border-border">
            <Pressable
              onPress={() => navigateReplace.toHomeRoot()}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 8,
                backgroundColor: pressed ? colors.border : "transparent",
              })}
            >
              <Ionicons name="arrow-back" size={20} color={colors.muted} />
              <Text className="ml-3 text-muted">アプリに戻る</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* メインコンテンツ */}
      <View className="flex-1">
        {/* モバイル用ヘッダー */}
        {!sidebarOpen && (
          <View
            className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border"
            style={{ paddingTop: insets.top + 12 }}
          >
            <Pressable
              onPress={() => setSidebarOpen(true)}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="menu" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">管理画面</Text>
            <Pressable
              onPress={() => navigateReplace.toHomeRoot()}
              style={({ pressed }) => ({
                padding: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        )}

        {/* サイドバー閉じるボタン（PC） */}
        {sidebarOpen && Platform.OS === "web" && (
          <Pressable
            onPress={() => setSidebarOpen(false)}
            style={({ pressed }) => ({
              position: "absolute",
              top: insets.top + 12,
              right: 12,
              padding: 8,
              zIndex: 10,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.muted} />
          </Pressable>
        )}

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </View>

      {/* モバイル用オーバーレイ */}
      {sidebarOpen && Platform.OS !== "web" && (
        <Pressable
          onPress={() => setSidebarOpen(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 260,
            right: 0,
            bottom: 0,
            backgroundColor: palette.gray900 + "80", // rgba(0,0,0,0.5) の透明度16進数
          }}
        />
      )}
    </View>
  );
}
