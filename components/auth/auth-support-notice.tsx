/**
 * ログインで止まったときの案内（kimitolink AuthSupportNotice の本番向け部分）。
 */
import { Link, type Href } from "expo-router";
import { Text, View } from "react-native";
import { LOGIN_HELP_INTRO, LOGIN_HELP_STEPS } from "@/lib/login-help";
import { palette } from "@/theme/tokens";

type AuthSupportNoticeProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthSupportNotice({ mode }: AuthSupportNoticeProps) {
  const title = mode === "sign-in" ? "ログインで止まったとき" : "アカウント作成で止まったとき";

  return (
    <View
      style={{
        width: "100%",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FDE68A",
        backgroundColor: "rgba(255,251,235,0.7)",
        padding: 12,
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 16, color: "#78350F" }}>{title}</Text>
      <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 21, color: "#92400E" }}>
        {LOGIN_HELP_INTRO}
      </Text>
      <View style={{ marginTop: 8, gap: 8 }}>
        {LOGIN_HELP_STEPS.map((step, i) => (
          <View key={step.lead} style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                marginTop: 2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#FDE68A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#78350F" }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: "#92400E" }}>
              <Text style={{ fontWeight: "800" }}>{step.lead}</Text>
              {"\n"}
              {step.body}
            </Text>
          </View>
        ))}
      </View>
      <Link href={"/lp/" as Href} asChild>
        <Text
          style={{
            marginTop: 12,
            minHeight: 44,
            fontWeight: "800",
            fontSize: 15,
            color: palette.kimitoBlue,
            textDecorationLine: "underline",
          }}
        >
          サービス紹介を見る
        </Text>
      </Link>
    </View>
  );
}
