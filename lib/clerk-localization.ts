import { jaJP } from "@clerk/localizations";

/**
 * Clerk 公式の日本語（jaJP）をベースに、見出しだけ「君斗りんくのすれ違ひ通信」向けに補足。
 * ボタン文言等は jaJP のまま（X で続行 等）。kimito.link の clerk-localization.ts に準拠。
 */
export const kimitoJaJP = {
  ...jaJP,
  signIn: {
    ...jaJP.signIn,
    start: {
      ...jaJP.signIn?.start,
      title: "君斗りんくのすれ違ひ通信にログイン",
      subtitle:
        "X（旧 Twitter）のアカウントで続けます。すれ違いの記録はログイン後に残せます。",
    },
  },
  signUp: {
    ...jaJP.signUp,
    start: {
      ...jaJP.signUp?.start,
      title: "はじめての方（新規登録）",
      subtitle:
        "X（旧 Twitter）で登録すると、すれ違いの記録と足あとを残せます。",
    },
  },
  unstable__errors: {
    ...jaJP.unstable__errors,
    external_account_not_found:
      "X のアカウント連携を確認できませんでした。もう一度「X で続ける」からお試しください。",
    captcha_invalid:
      "確認に失敗しました。お手数ですが、もう一度お試しください。",
    captcha_unavailable:
      "確認画面を表示できませんでした。ページを再読み込みして、もう一度お試しください。",
  },
} as typeof jaJP;
