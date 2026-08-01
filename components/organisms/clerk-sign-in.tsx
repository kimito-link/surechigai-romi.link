/**
 * Native フォールバック: Clerk の Web コンポーネント `<SignIn />` は RN ネイティブで
 * 描画できないため、プログラム的 OAuth（startOAuthFlow 経由の login()）を呼ぶ。
 * Web では同名の clerk-sign-in.web.tsx が解決される。
 */

import { Pressable, Text } from "react-native";
import { useAuth } from "@/hooks/use-auth";

export function ClerkSignIn(_props: { redirectUrl: string }) {
  const { login } = useAuth();
  return (
    <Pressable
      onPress={() => login()}
      style={{
        backgroundColor: "#0f1419",
        borderRadius: 14,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
        X（旧 Twitter）で続ける
      </Text>
    </Pressable>
  );
}
