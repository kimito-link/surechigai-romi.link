/**
 * /sign-in — kimito.link のログイン画面の忠実コピー。
 *
 * Web では kimito.link と同一の Clerk 標準 `<SignIn />`（@clerk/react）をそのまま描画する
 * （ClerkSignIn が .web.tsx / .tsx でプラットフォーム分離）。appearance / localization は
 * ClerkProvider（_layout.tsx）で kimito 由来のものを適用済み。
 * カードの外装（✓ パスワード不要 / 下のボタンを押すだけ ↓）も kimito の AuthPageShell に準拠。
 */

import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { ClerkSignIn } from "@/components/organisms/clerk-sign-in";
import { palette } from "@/theme/tokens";

const HEADLINE = "X だけで安全ログイン・パスワード不要";

function resolveRedirectUrl(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") return "/";
  const param = new URLSearchParams(window.location.search).get("redirect_url");
  if (param && param.trim()) return param;
  return "/";
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: "100%", maxWidth: 448, alignSelf: "center" }}>
      <View
        style={{
          width: "100%",
          borderRadius: 32,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(0,66,123,0.15)",
          backgroundColor: "rgba(255,255,255,0.97)",
          shadowColor: palette.kimitoBlue,
          shadowOpacity: 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        {/* 安心ヘッダー: ✓ パスワード不要 ＋ 次にやることを明示（kimito 準拠） */}
        <View
          style={{
            backgroundColor: palette.kimitoBlueSoft,
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#047857", fontSize: 12, fontWeight: "800" }}>
                ✓
              </Text>
            </View>
            <Text
              style={{
                color: palette.kimitoBlue,
                fontSize: 14,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {HEADLINE}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 6,
              color: palette.kimitoOrange,
              fontSize: 12,
              fontWeight: "800",
            }}
          >
            下のボタンを押すだけ ↓
          </Text>
        </View>
        <View style={{ padding: 14 }}>{children}</View>
      </View>
    </View>
  );
}

export default function SignInScreen() {
  const redirectUrl = useMemo(resolveRedirectUrl, []);

  return (
    <LinearGradient
      colors={["#E8F1FB", "#FFFFFF", "#FFF3E8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 16,
          paddingVertical: 32,
        }}
      >
        <AuthCard>
          <ClerkSignIn redirectUrl={redirectUrl} />
        </AuthCard>
      </ScrollView>
    </LinearGradient>
  );
}
