import { useState, useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";

const STORAGE_KEY = "@install_prompt_dismissed";

/**
 * PWAインストールプロンプトコンポーネント
 * 
 * ユーザーに「ホーム画面に追加」を促すバナーを表示します。
 * - すでにインストール済み（standalone mode）なら表示しない
 * - ユーザーが「後で」を選択したら、AsyncStorageに保存して非表示
 * - Web版のみ表示（ネイティブアプリでは不要）
 */
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const colors = useColors();

  useEffect(() => {
    async function checkInstallStatus() {
      // Web版以外では表示しない
      if (Platform.OS !== "web") {
        return;
      }

      // すでにホーム画面に追加済みか確認
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      setIsStandalone(standalone);

      if (standalone) {
        return;
      }

      // ユーザーが「後で」を選択したか確認
      const dismissed = await AsyncStorage.getItem(STORAGE_KEY);
      if (dismissed === "true") {
        return;
      }

      // バナーを表示
      setShowPrompt(true);
    }

    checkInstallStatus();
  }, []);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    setShowPrompt(false);
  };

  const handleShowInstructions = () => {
    navigate.toInstallInstructions();
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <View
      style={{
        position: "fixed" as any,
        bottom: 80,
        left: 16,
        right: 16,
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        shadowColor: palette.gray900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: color.textWhite, marginBottom: 4 }}>
            📱 ホーム画面に追加
          </Text>
          <Text style={{ fontSize: 14, color: color.textWhite + "E6" }}>
            アプリのように使えます
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => ({
            padding: 4,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 20, color: color.textWhite, fontWeight: "bold" }}>×</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={handleShowInstructions}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: color.textWhite,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
            追加方法を見る
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: color.textWhite,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: color.textWhite, fontWeight: "600", fontSize: 14 }}>
            後で
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
