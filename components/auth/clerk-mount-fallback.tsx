/**
 * Clerk 読込中プレースホルダ。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ★2026-08-28: iOS build 529 が Guideline 2.1(a) で却下された実体がここ。
 *
 *   審査コメント: "we were unable to tap Apple and X sign in as it was greyed out"
 *   審査端末: iPad Air 11-inch (M3) / iPadOS 26.6.1
 *
 * ■ ★何が起きていたか
 *   旧実装はここに「gray100 の箱・gray400 の文字・opacity 0.85」を描いていた。
 *   ★見た目は完全に「灰色で無効化されたボタン」だが、実体は Pressable ですらない
 *   ただの View。押しても当然なにも起きない。
 *
 *   app/sign-in.tsx は `isAuthReady ? <ClerkSignIn/> : <ClerkMountFallback/>` で分岐する。
 *   ★`isAuthReady` は clerkIsLoaded そのもので**上限が無い**
 *   （上限つきの `isAuthReadyForUI` は 1000ms で true になるが、こちらは別の信号）。
 *   ⟹ Clerk chunk の解決が遅い・失敗すると、この灰色の箱が**そのまま残り続ける**。
 *   審査は初回起動＝キャッシュ空なので、ここに入りやすい。
 *
 * ■ ★直し方の原則（過去2回ここで方向を間違えている）
 *   ・2026-08-21(520): 「押せなくする」方向で直しかけ、読込失敗時に永久 disabled になる
 *     詰みを作りかけた。★押せない方が却下より悪い。
 *   ・2026-08-22(521): 押せる見た目に戻したが、押しても無言で何も起きなかった。
 *
 *   ⟹ ★正解は「**最初から押せる本物のボタンを出す**」。
 *     待っている間もユーザーは押せる。押した結果 Clerk が未ロードなら、
 *     clerk-auth-bridge の isSilentOAuthNoop() が**見えるエラー**を出す（実装済み）。
 *     ★「押せない」も「無言」も作らない。
 *
 * ■ ★ここに新しい import を足さないこと
 *   2026-07-31、この周辺に lib/auth-providers の import を足したところ Metro の
 *   チャンク分割が変わり、本番の /sign-in が
 *   「useUser can only be used within the <ClerkProvider />」で壊れた。
 *   ★useAuth() はこの画面では既に上位（AuthContextProvider）が必ず配っているので安全
 *   （chunk 解決待ちの間も app/_layout.tsx が AUTH_LOADING_PLACEHOLDER を配る設計）。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/theme/tokens";

type ClerkMountFallbackProps = {
  mode: "sign-in" | "sign-up";
};

function XGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#ffffff"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </Svg>
  );
}

export function ClerkMountFallback({ mode }: ClerkMountFallbackProps) {
  const { login } = useAuth();

  const heading =
    mode === "sign-in"
      ? "君斗りんくのすれ違ひ通信にログイン"
      : "君斗りんくのすれ違ひ通信をはじめる";

  return (
    <View style={{ alignItems: "center", gap: 16, paddingVertical: 28, paddingHorizontal: 20 }}>
      <Text style={{ fontWeight: "800", fontSize: 16, color: palette.gray900 }}>{heading}</Text>
      <Text style={{ fontSize: 14, color: palette.gray500, textAlign: "center" }}>
        X または Apple のアカウントで続けます。
      </Text>

      {/* ★灰色の飾りではなく、本物の押せるボタンを出す（529 却下の直し）。
          Guideline 4.8 のため X と Apple を必ず**並べて**出す。 */}
      <View style={{ gap: 12, width: "100%", maxWidth: 320 }}>
        <Pressable
          onPress={() => login(undefined, false, "x")}
          accessibilityRole="button"
          accessibilityLabel="X（旧 Twitter）で続ける"
          style={{
            backgroundColor: "#0f1419",
            borderRadius: 14,
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 16,
          }}
        >
          <XGlyph />
          <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>
            X（旧 Twitter）で続ける
          </Text>
        </Pressable>

        <Pressable
          onPress={() => login(undefined, false, "apple")}
          accessibilityRole="button"
          accessibilityLabel="Apple で続ける"
          style={{
            backgroundColor: "#000000",
            borderRadius: 14,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>Apple で続ける</Text>
        </Pressable>
      </View>
    </View>
  );
}
