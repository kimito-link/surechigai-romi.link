/**
 * 「X で続ける」ボタンの直前に出す遷移予告（kimitolink AuthRedirectNotice 準拠）。
 */
import { Text, View } from "react-native";
import { palette } from "@/theme/tokens";

type AuthRedirectNoticeProps = {
  mode: "sign-in" | "sign-up";
};

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
      <Text style={{ color: palette.kimitoBlue, fontWeight: "800", marginTop: 2 }} accessibilityElementsHidden>
        ✓
      </Text>
      <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: palette.gray700 }}>{children}</Text>
    </View>
  );
}

export function AuthRedirectNotice({ mode }: AuthRedirectNoticeProps) {
  const action = mode === "sign-in" ? "ログイン" : "登録";

  return (
    <View
      style={{
        width: "100%",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(0,66,123,0.2)",
        backgroundColor: "rgba(226,237,247,0.6)",
        padding: 12,
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 15, color: palette.gray900 }}>
        次に X（旧 Twitter）の画面に移動します
      </Text>
      <CheckItem>
        受け取るのは
        <Text style={{ fontWeight: "800", color: palette.gray900 }}>お名前とアイコンだけ</Text>
        です。あなたの代わりに投稿することはありません。
      </CheckItem>
      <CheckItem>
        X にまだ{action}していない方は、先に
        <Text style={{ fontWeight: "800", color: palette.gray900 }}>X のログイン画面</Text>
        が出ます。
      </CheckItem>
      <CheckItem>
        黒い画面で
        <Text style={{ fontWeight: "800", color: palette.gray900 }}>「アプリにアクセスを許可」</Text>
        を押すと、自動でこのサイトに戻ります。
      </CheckItem>
    </View>
  );
}
