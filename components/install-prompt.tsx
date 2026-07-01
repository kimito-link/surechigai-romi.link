import { useState, useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { color, palette } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const SHOW_DELAY_MS = 3000;

/**
 * PWA インストールプロンプト — オンボード完了後に表示
 */
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const colors = useColors();
  const { shouldShowInstallUi, isInstallable, promptInstall, dismissPrompt, isStandalone } =
    usePwaInstall();

  useEffect(() => {
    if (!shouldShowInstallUi) return;

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [shouldShowInstallUi]);

  const handleDismiss = () => {
    void dismissPrompt();
    setShowPrompt(false);
  };

  const handlePrimary = () => {
    if (isInstallable) {
      void promptInstall();
      return;
    }
    navigate.toInstallInstructions();
  };

  if (!showPrompt || isStandalone || Platform.OS !== "web") {
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
            ホーム画面に追加
          </Text>
          <Text style={{ fontSize: 14, color: color.textWhite + "E6" }}>
            チェックインが1タップで始まります
          </Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => ({
            padding: 4,
            opacity: pressed ? 0.6 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        >
          <Text style={{ fontSize: 20, color: color.textWhite, fontWeight: "bold" }}>×</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={handlePrimary}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: color.textWhite,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
          accessibilityRole="button"
        >
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
            {isInstallable ? "インストール" : "追加方法を見る"}
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
          accessibilityRole="button"
        >
          <Text style={{ color: color.textWhite, fontWeight: "600", fontSize: 14 }}>
            後で
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
