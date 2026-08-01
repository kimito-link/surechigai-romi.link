/**
 * Native フォールバック: Clerk の Web コンポーネント `<SignIn />` は RN ネイティブで
 * 描画できないため、プログラム的 OAuth（startOAuthFlow 経由の login()）を呼ぶ。
 * Web では同名の clerk-sign-in.web.tsx が解決される。
 *
 * Apple ボタンは App Store Guideline 4.8（サードパーティのソーシャルログインを
 * 提供するなら同等の選択肢も出す）への対応。Clerk 側で oauth_apple は有効化済みで、
 * Web の <SignIn /> は既に Apple/Google/X の3ボタンを描画している（2026-07-31 確認）。
 * ネイティブはこの画面が自前実装なので、ここに明示的に置く必要がある。
 *
 * ★このファイルに新しい import を足さないこと。
 * 2026-07-31、ここに lib/auth-providers の import を足したところ Metro のチャンク分割が
 * 変わり、本番の /sign-in が「useUser can only be used within the <ClerkProvider />」で
 * 壊れた（ClerkRootProvider は app/_layout.tsx で動的 import される設計のため、
 * 解決タイミングがずれると Provider の外で useUser が走る）。
 * Apple ボタンの出し分けが必要になったら、props で受けて呼び出し側で判定すること。
 */

import { Pressable, Text, View } from "react-native";
import { useAuth } from "@/hooks/use-auth";

export function ClerkSignIn(_props: { redirectUrl: string }) {
  const { login } = useAuth();

  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Pressable
        onPress={() => login(undefined, false, "x")}
        accessibilityRole="button"
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

      <Pressable
        onPress={() => login(undefined, false, "apple")}
        accessibilityRole="button"
        style={{
          backgroundColor: "#000000",
          borderRadius: 14,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
          Apple で続ける
        </Text>
      </Pressable>
    </View>
  );
}
