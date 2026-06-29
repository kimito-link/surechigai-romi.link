/**
 * Clerk 読込中プレースホルダ（kimitolink ClerkMountFallback 準拠）。
 */
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { palette } from "@/theme/tokens";

type ClerkMountFallbackProps = {
  mode: "sign-in" | "sign-up";
};

function XGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill={palette.gray400}
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </Svg>
  );
}

export function ClerkMountFallback({ mode }: ClerkMountFallbackProps) {
  const heading =
    mode === "sign-in"
      ? "君斗りんくのすれ違ひ通信にログイン"
      : "君斗りんくのすれ違ひ通信をはじめる";

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={mode === "sign-in" ? "ログイン画面を準備中" : "登録画面を準備中"}
      style={{ alignItems: "center", gap: 16, paddingVertical: 28, paddingHorizontal: 20 }}
    >
      <Text style={{ fontWeight: "800", fontSize: 16, color: palette.gray900 }}>{heading}</Text>
      <Text style={{ fontSize: 14, color: palette.gray500, textAlign: "center" }}>
        X（旧 Twitter）のアカウントで続けます。
      </Text>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: "100%",
          maxWidth: 320,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.gray200,
          backgroundColor: palette.gray100,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: 0.85,
        }}
      >
        <XGlyph />
        <Text style={{ fontWeight: "700", color: palette.gray400, fontSize: 15 }}>
          X / Twitter で続ける
        </Text>
      </View>
    </View>
  );
}
