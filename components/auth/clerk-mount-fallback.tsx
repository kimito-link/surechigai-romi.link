/**
 * Clerk 読込中プレースホルダ。★「最初から押せる本物のボタン」を「本物と同じ寸法」で出す。
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
 * ■ ★2026-10-05: 寸法を「本物」に合わせた（ちらつきゼロ契約 ②「プレースホルダは本物と同寸・同色」。
 *   正本: web-ios-android/templates/web/auth-mode/README.md ④ ／ _docs/DESIGN-signin-no-flicker-2026-10-05.md 判断 2）。
 *   本物はプラットフォームで違う:
 *   ・ネイティブ（iOS / Android）の本物 ＝ components/organisms/clerk-sign-in.tsx（X / Apple の 2 ボタン、gap 12）。
 *     旧実装は見出し＋補足文＋paddingVertical 28 を足していて本物より**高く**、差し替えで縮む方向にずれていた。
 *     → 見出し等を外し、本物と同じ 2 ボタンの箱（48×2 + 12 = 108px）にする。
 *   ・Web の本物 ＝ Clerk の `<SignIn/>` カード（ロゴ・見出し・X / Apple / Google の 3 ボタン・フッター、486px @430）。
 *     旧実装は 2 ボタンの小箱で本物より**低く**、差し替えで下がずれていた。
 *     → 本番 DOM を実測した箱モデル（lib/clerk-card-box-model.ts）どおりに描く。
 *   寸法の数値はこのファイルに書かず lib/clerk-card-box-model.ts（依存ゼロの純モジュール）に置く。
 *   契約テスト: __tests__/signin-no-flicker.test.tsx。
 *
 * ■ ★ここに新しい import を足さないこと
 *   2026-07-31、この周辺に lib/auth-providers の import を足したところ Metro の
 *   チャンク分割が変わり、本番の /sign-in が
 *   「useUser can only be used within the <ClerkProvider />」で壊れた。
 *   ★useAuth() はこの画面では既に上位（AuthContextProvider）が必ず配っているので安全
 *   （chunk 解決待ちの間も app/_layout.tsx が AUTH_LOADING_PLACEHOLDER を配る設計）。
 *   ★2026-10-05 に足した `@/lib/clerk-card-box-model` は **import を一切持たない定数だけのモジュール**
 *     （他モジュールを引き込まないのでチャンクのグラフを変えない）。これ以外は足さない。
 * ───────────────────────────────────────────────────────────────────────────
 */
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/hooks/use-auth";
import {
  CLERK_CARD_BOX_MODEL,
  CLERK_CARD_PROVIDERS,
  NATIVE_SIGN_IN_BOX_MODEL,
  clerkCardBoxWidth,
} from "@/lib/clerk-card-box-model";

type ClerkMountFallbackProps = {
  mode: "sign-in" | "sign-up";
};

// Clerk の appearance（lib/clerk-appearance.ts: X_BLACK）と本番 DOM の実測色。ブランドトークンではなく
// 「本物の Clerk カードの色」を写す（同色の契約）。
const X_BLACK = "#0f1419";
const CLERK_TEXT = "rgb(33, 33, 38)";
const CLERK_SUBTEXT = "rgba(33, 33, 38, 0.65)";
const BUTTON_TEXT = "#0f172a";
const BUTTON_RING = "rgba(15, 23, 42, 0.18)";

function XGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#ffffff"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </Svg>
  );
}

/** ネイティブの本物（clerk-sign-in.tsx）と同じ 2 ボタン・同じ gap。 */
function NativeSignInFallback({ login }: { login: ReturnType<typeof useAuth>["login"] }) {
  const box = NATIVE_SIGN_IN_BOX_MODEL;
  return (
    <View style={{ gap: box.buttonGap, width: "100%" }}>
      {/* ★灰色の飾りではなく、本物の押せるボタンを出す（529 却下の直し）。
          Guideline 4.8 のため X と Apple を**並べて**出す（片方だけにしない）。 */}
      <Pressable
        onPress={() => login(undefined, false, "x")}
        accessibilityRole="button"
        accessibilityLabel="X（旧 Twitter）で続ける"
        style={{
          backgroundColor: X_BLACK,
          borderRadius: box.buttonRadius,
          minHeight: box.buttonMinHeight,
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
          borderRadius: box.buttonRadius,
          minHeight: box.buttonMinHeight,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}>Apple で続ける</Text>
      </Pressable>
    </View>
  );
}

/** Web の本物（Clerk の <SignIn/> カード）と同じ箱モデル。ボタンは押せる。 */
function WebClerkCardFallback({
  mode,
  login,
}: {
  mode: "sign-in" | "sign-up";
  login: ReturnType<typeof useAuth>["login"];
}) {
  const box = CLERK_CARD_BOX_MODEL;
  const { width } = useWindowDimensions();

  // 文言は lib/clerk-localization.ts（Clerk に渡しているもの）と同じ。
  const title = mode === "sign-in" ? "君斗りんくのすれ違ひ通信にログイン" : "はじめての方（新規登録）";
  const subtitle =
    mode === "sign-in"
      ? "X・Apple・Google のいずれかで続けます。すれ違いの記録はログイン後に残せます。"
      : "X（旧 Twitter）で登録すると、すれ違いの記録と足あとを残せます。";

  // ★Google: useAuth().login は "x" | "apple" しか受けない（ネイティブの startOAuthFlow の都合）。
  //   Web ではどのボタンも「/sign-in を開き直す」だけなので、Google は auto=x を付けない切替用 URL
  //   （forceSwitch=true）で本物のカードへ送り、そこで Google を選んでもらう。
  //   ★「押せない」「無言」を作らない原則はここでも守る。
  const onPress = (key: (typeof CLERK_CARD_PROVIDERS)[number]["key"]) => {
    if (key === "x" || key === "apple") return login(undefined, false, key);
    return login(undefined, true);
  };

  return (
    <View
      accessibilityRole="none"
      style={{
        // = .cl-cardBox
        width: clerkCardBoxWidth(width),
        alignSelf: "center",
        borderRadius: box.cardBoxRadius,
      }}
    >
      {/* = .cl-card（本物と同じ -1px の margin・白・radius 8） */}
      <View
        style={{
          margin: box.cardMarginPx,
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderRadius: box.cardRadius,
          paddingVertical: box.cardPaddingY,
          paddingHorizontal: box.cardPaddingX,
          gap: box.cardGap,
        }}
      >
        {/* = .cl-header */}
        <View style={{ gap: box.headerGap }}>
          {/* = .cl-logoBox（logoPlacement:"inside" で中央）。画像は Clerk が描くまで同寸の枠だけ */}
          <View
            style={{
              width: box.logoWidth,
              height: box.logoHeight,
              alignSelf: "center",
              borderRadius: 10,
              backgroundColor: "rgba(0, 66, 123, 0.08)",
            }}
          />
          <View style={{ gap: box.titleSubtitleGap }}>
            <Text
              numberOfLines={1}
              style={{
                height: box.titleLineHeight,
                lineHeight: box.titleLineHeight,
                fontSize: 17,
                fontWeight: "700",
                color: CLERK_TEXT,
              }}
            >
              {title}
            </Text>
            <Text
              numberOfLines={box.subtitleLines}
              style={{
                height: box.subtitleLineHeight * box.subtitleLines,
                lineHeight: box.subtitleLineHeight,
                fontSize: 13,
                color: CLERK_SUBTEXT,
              }}
            >
              {subtitle}
            </Text>
          </View>
        </View>

        {/* = .cl-socialButtons（ボタン × n ＋ gap × (n-1)）。★本物の押せるボタン */}
        <View style={{ gap: box.buttonGap }}>
          {CLERK_CARD_PROVIDERS.map((p) => {
            const label = `${p.title}で続ける`;
            return (
              <Pressable
                key={p.key}
                onPress={() => onPress(p.key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={{
                  height: box.buttonHeight,
                  borderRadius: box.buttonRadius,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  paddingHorizontal: 12,
                  backgroundColor: p.hero ? X_BLACK : "#ffffff",
                  borderWidth: p.hero ? 0 : 1,
                  borderColor: BUTTON_RING,
                }}
              >
                {p.key === "x" ? (
                  <XGlyph size={16} />
                ) : (
                  <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: "#e2e8f0" }} />
                )}
                <Text style={{ color: p.hero ? "#ffffff" : BUTTON_TEXT, fontSize: 15, fontWeight: "600" }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* = .cl-footer（action 行 ＋ Secured by Clerk 行）。文言は Clerk の jaJP と同じ */}
      <View>
        <Text
          style={{
            height: box.footerActionHeight,
            paddingVertical: (box.footerActionHeight - 18) / 2,
            lineHeight: 18,
            fontSize: 13,
            textAlign: "center",
            color: CLERK_SUBTEXT,
          }}
        >
          アカウントをお持ちでないですか？ <Text style={{ color: CLERK_TEXT, fontWeight: "500" }}>サインアップ</Text>
        </Text>
        <View style={{ height: box.footerBadgeHeight }} />
      </View>
    </View>
  );
}

export function ClerkMountFallback({ mode }: ClerkMountFallbackProps) {
  const { login } = useAuth();

  // ★Platform.OS はモジュール先頭ではなく描画時に読む（契約テストが web / native を切り替えて描くため）。
  if (Platform.OS === "web") {
    return <WebClerkCardFallback mode={mode} login={login} />;
  }
  return <NativeSignInFallback login={login} />;
}
