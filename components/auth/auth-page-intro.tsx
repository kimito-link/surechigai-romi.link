/**
 * 左カラムのサービス説明（kimitolink AuthPageIntro 準拠・surechigai 向け文言）。
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, type Href } from "expo-router";
import { Text, View } from "react-native";
import { palette } from "@/theme/tokens";

type AuthPageIntroProps = {
  variant: "sign-in" | "sign-up";
};

const MASCOTS = [
  {
    source: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
    name: "ゆっくりリンク",
  },
  {
    source: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
    name: "こん太",
  },
  {
    source: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
    name: "たぬ姉",
  },
] as const;

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
      <Text style={{ color: palette.kimitoBlue, fontWeight: "800", marginTop: 2 }} accessibilityElementsHidden>
        ✓
      </Text>
      <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: palette.gray600 }}>{children}</Text>
    </View>
  );
}

function NavLink({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Text
        style={{
          minHeight: 44,
          fontWeight: "700",
          fontSize: 14,
          color: palette.kimitoBlue,
          textDecorationLine: "underline",
        }}
      >
        {label}
      </Text>
    </Link>
  );
}

export function AuthPageIntro({ variant }: AuthPageIntroProps) {
  const isSignIn = variant === "sign-in";

  return (
    <View
      accessibilityLabel="サービス説明"
      style={{
        width: "100%",
        maxWidth: 576,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(0,66,123,0.15)",
        backgroundColor: "rgba(255,255,255,0.95)",
        overflow: "hidden",
        shadowColor: palette.kimitoBlue,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <LinearGradient
        colors={[palette.kimitoBlueSoft, "#FFFFFF", "#FFF3E8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
      >
        <Text
          style={{
            alignSelf: "center",
            backgroundColor: "rgba(255,255,255,0.9)",
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 999,
            fontWeight: "800",
            fontSize: 15,
            color: palette.kimitoBlue,
            overflow: "hidden",
          }}
        >
          {isSignIn ? "おかえり〜！待ってたよ" : "はじめまして！"}
        </Text>
        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {MASCOTS.map((m) => (
            <Image key={m.name} source={m.source} style={{ width: 96, height: 96 }} contentFit="contain" />
          ))}
        </View>
      </LinearGradient>

      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.5,
            color: palette.kimitoBlue,
            textTransform: "uppercase",
          }}
        >
          君斗りんくのすれ違ひ通信
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            marginTop: 8,
            fontSize: 22,
            fontWeight: "800",
            lineHeight: 30,
            color: palette.gray900,
          }}
        >
          {isSignIn
            ? "移動の足あとを残し、すれ違いの思い出をたどる"
            : "X アカウントひとつで、足あと記録とすれ違い通信をはじめる"}
        </Text>
        <Text style={{ marginTop: 12, fontSize: 16, lineHeight: 24, color: palette.gray600 }}>
          会いたい君がいる現在地——正確な場所を残して、あとからたどれる。
          ログインは{" "}
          <Text style={{ fontWeight: "700", color: palette.gray900 }}>X（旧 Twitter）のアカウントだけ</Text>
          。新しいパスワードはいりません。
        </Text>

        <Text style={{ marginTop: 20, fontSize: 15, fontWeight: "800", color: palette.gray900 }}>
          {isSignIn ? "ログイン後にできること" : "登録後にできること"}
        </Text>
        <CheckItem>
          <Text style={{ fontWeight: "600", color: palette.gray900 }}>移動の足あと</Text>
          を正確な座標で記録し、思い出の場所へ戻れる
        </CheckItem>
        <CheckItem>
          同じ場所を通った人との
          <Text style={{ fontWeight: "600", color: palette.gray900 }}>すれ違い</Text>
          を記録・リアクション
        </CheckItem>
        <CheckItem>
          訪れたエリアの
          <Text style={{ fontWeight: "600", color: palette.gray900 }}>図鑑</Text>
          を集めて、日本地図を彩る
        </CheckItem>

        <View
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: palette.gray200,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <NavLink href="/" label="アプリトップ" />
          <NavLink href={"/lp/" as Href} label="サービス紹介" />
          <NavLink href="/special-thanks" label="特別協力" />
        </View>
      </View>
    </View>
  );
}
