/**
 * X 認可画面で「キャンセル」して sign-in へ戻ってきた人に、やさしい「おかえり」を出す。
 * kimitolink AutoXReturnNotice 準拠。
 * 検知は Clerk のパラメータに依存せず、「AutoAdvanceToX が自動発火した記録があるのに、
 * 一定時間後もまだ sign-in（未ログイン）に居る」ことで行う（＝X認可を完了せず戻った）。
 * 自動で再発火はしない（本人がキャンセルしたのに勝手に飛ばすのは余計なお世話）。
 */
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useUser } from "@clerk/expo";
import { Link, type Href } from "expo-router";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/clerk-route";
import { palette } from "@/theme/tokens";

// auto-advance-to-x.tsx が自動発火時に打刻するキー（同じものを参照）。
const FIRED_KEY = "surechigai:auto-x-last-fired-at";
// このコンポーネントで「おかえり」を一度出したら畳むためのキー（毎回出してしつこくしない）。
const NOTICE_SHOWN_KEY = "surechigai:auto-x-return-notice-shown";
// 自動発火からこの時間以上経ってまだ sign-in に居る＝X認可を完了せず戻ってきた、とみなす。
// 短すぎると「X画面へ遷移中の一瞬」で誤爆する。往復に十分な猶予を置く。
const RETURN_MIN_ELAPSED_MS = 4000;
const RETURN_MAX_ELAPSED_MS = 10 * 60 * 1000; // 古すぎる記録は無視（別セッションの残骸）。

function firedAt(): number | null {
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function alreadyShown(): boolean {
  try {
    return sessionStorage.getItem(NOTICE_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown(): void {
  try {
    sessionStorage.setItem(NOTICE_SHOWN_KEY, "1");
  } catch {
    // 出せなくても実害はない（メッセージが再表示されうるだけ）。
  }
}

export function AutoXReturnNotice() {
  const { isLoaded, isSignedIn } = useUser();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!isLoaded || isSignedIn) return;
    if (alreadyShown()) return;

    const fired = firedAt();
    if (fired == null) return;

    const check = () => {
      const elapsed = Date.now() - fired;
      if (elapsed >= RETURN_MIN_ELAPSED_MS && elapsed <= RETURN_MAX_ELAPSED_MS) {
        markShown();
        setShow(true);
      }
    };

    // 着地直後は「まだ往復中」かもしれないので、猶予後に判定する。
    const remaining = Math.max(0, RETURN_MIN_ELAPSED_MS - (Date.now() - fired));
    const timer = window.setTimeout(check, remaining + 100);
    return () => window.clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  if (!show) return null;

  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={{
        marginBottom: 12,
        width: "100%",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,140,66,0.3)",
        backgroundColor: "rgba(255,243,232,0.8)",
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "800", color: palette.kimitoOrange, textAlign: "center" }}>
        おかえりなさい🍵
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 14,
          lineHeight: 20,
          color: palette.gray700,
          textAlign: "center",
        }}
      >
        ログインはキャンセルされました。あなたのプロフィールやリンクはそのまま残っています。{"\n"}
        もう一度ログインするときは、下の「X / Twitterで続ける」を押してください。
      </Text>
      <Link
        href={SIGN_IN_AUTO_X_HREF as Href}
        style={{
          marginTop: 12,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          backgroundColor: palette.kimitoBlue,
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: palette.white }}>
          もう一度Xでログインする
        </Text>
      </Link>
    </View>
  );
}
