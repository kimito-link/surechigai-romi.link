import { View, ActivityIndicator } from "react-native";
import { color } from "@/theme/tokens";

/** Clerk chunk 読込中の軽量プレースホルダ（初回 bundle に Clerk を含めない）。 */
export function AppBootstrapFallback() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0F4F8",
      }}
    >
      <ActivityIndicator size="large" color={color.accentPrimary} />
    </View>
  );
}
