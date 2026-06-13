import { View, Text, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";

/**
 * ログインローディング画面
 */
export function LoginLoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: color.bg }}>
      <ActivityIndicator size="large" color={color.accentPrimary} />
      <Text style={{ color: color.textMuted, fontSize: 14 }}>Twitter認証中...</Text>
    </View>
  );
}
