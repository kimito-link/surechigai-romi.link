import { View, Text, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";

interface LoadingScreenProps {
  message?: string;
  showCharacter?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * 汎用ローディング画面コンポーネント
 */
export function LoadingScreen({ message = "読み込み中..." }: LoadingScreenProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <ActivityIndicator size="large" color={color.accentPrimary} />
      <Text style={{ color: color.textMuted, fontSize: 14 }}>{message}</Text>
    </View>
  );
}
