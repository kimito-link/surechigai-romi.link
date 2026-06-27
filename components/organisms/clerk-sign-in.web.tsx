/**
 * Web 専用: kimito.link と同一の Clerk 標準 `<SignIn />`（@clerk/react）を描画する。
 * appearance / localization は ClerkProvider 側で kimito 由来を適用済み。
 * routing="hash" で Expo Router のパス解決と衝突させない（OAuth コールバックも
 * /sign-in#/sso-callback で <SignIn/> 自身が処理する）。
 *
 * Native では同名の clerk-sign-in.tsx（フォールバック）が解決される。
 */

// ★ context 共有のため必ず @clerk/expo/web から取得する。
//   @clerk/react から直接 import すると ClerkProvider(@clerk/expo) と別インスタンスになり
//   「SignIn can only be used within <ClerkProvider/>」で落ちる。
import { SignIn } from "@clerk/expo/web";
import { ActivityIndicator, Text, View } from "react-native";
import { color } from "@/theme/tokens";

export function ClerkSignIn({ redirectUrl }: { redirectUrl: string }) {
  return (
    <SignIn
      routing="hash"
      signUpUrl="/sign-in"
      fallbackRedirectUrl={redirectUrl}
      forceRedirectUrl={redirectUrl}
      fallback={
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text style={{ marginTop: 12, color: color.textSecondary }}>
            ログイン画面を準備中…
          </Text>
        </View>
      }
    />
  );
}
