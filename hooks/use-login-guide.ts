import { router, usePathname, type Href } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useAuthHandoff } from "@/lib/auth-handoff-context";
import { buildSignInHref, buildSignInSwitchHref } from "@/lib/clerk-route";

export type LoginGuideMode = "same" | "switch";

type LoginGuideOptions = {
  returnTo?: string;
  mode?: LoginGuideMode;
};

function normalizeReturnTo(pathname: string | null): string {
  if (!pathname || pathname === "/auth/kimito-link") return "/";
  if (pathname.startsWith("/(tabs)/")) return pathname.replace("/(tabs)", "");
  if (pathname === "/(tabs)") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * ログイン誘導フック。
 *
 * ★2026-08-24 に方針を変えた（iOS build 524 が Guideline 4.8 で却下されたため）。
 *
 * 【却下の内容】
 *   "The app uses a third-party login service, but does not appear to offer as an
 *    equivalent login option another login service with all of the following features"
 *   審査端末 iPhone 17 Pro Max。名指しされたのはメニュー画面。
 *
 * 【真因】Sign in with Apple は**実装済み**だった（components/organisms/clerk-sign-in.tsx
 *   が X と Apple を縦に並べている）。★問題は、その画面に辿り着く経路が
 *   `app/sign-in.tsx` の1本しか無かったこと。
 *   実測: ClerkSignIn を通る画面 1つ / このフックを使う画面 11。
 *   このフックは `login()` を provider 省略で呼ぶため既定の "x" に直行し、
 *   ★**Apple を選ぶ隙が構造的に無かった**。
 *   ＝ 実装の有無ではなく「同じ画面に並んでいない」ことが 4.8 に触れた。
 *
 * 【対処】X へ直行せず、**両方が並んでいる /sign-in へ送る**。
 *   ★`auto=x` は付けない。付けると着地後に X ボタンを自動クリックしてしまい、
 *   結局 Apple を選べない（＝却下と同じ状態に戻る）。
 *
 * ★副次効果: build 524 のもう1件（2.1(a)「Xでログインを押したらエラー」）にも効く。
 *   ネイティブでこのフックは `login()` を直に呼んでおり、Clerk 未ロード時は
 *   isSilentOAuthNoop の throw がそのままエラー表示になっていた。
 *   /sign-in を経由すれば、その画面が読み込み状態を持って出し分けられる。
 */
export function useLoginGuide() {
  const pathname = usePathname();
  const { login } = useAuth();
  const { showHandoff } = useAuthHandoff();

  return useCallback(
    (options: LoginGuideOptions = {}) => {
      const returnTo = options.returnTo ?? normalizeReturnTo(pathname);
      const isSwitch = options.mode === "switch";
      // ★「X へ行く」と決め打ちした案内は出さない（選べる画面へ送るため）。
      //   "other" = 特定のプロバイダを名指ししない案内。
      showHandoff("other");

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // ★auto=x を付けない。付けると着地後に X が自動クリックされ、
        //   Apple を選べない＝却下された状態に戻る。
        window.location.href = isSwitch
          ? buildSignInSwitchHref(returnTo)
          : buildSignInHref(returnTo);
        return;
      }

      // ★ネイティブも同じ画面へ送る。login() を直に呼ぶと provider 既定の "x" に
      //   直行してしまい、Apple が選べない（4.8）。
      router.push(
        (isSwitch ? buildSignInSwitchHref(returnTo) : buildSignInHref(returnTo)) as Href,
      );
    },
    [pathname, login, showHandoff],
  );
}
