import { jaJP } from "@clerk/localizations";

/**
 * Clerk 公式の日本語（jaJP）をベースに、すれ違ひ通信向けの見出しだけ補足。
 * ★出典: kimitolink-linktree/lib/clerk-localization.ts
 *   Google/Appleのブランド規約（ソーシャルボタンの表示文言）を満たす形を踏襲する。
 */
export const surechigaiJaJP = {
  ...jaJP,
  // ★ソーシャルボタンの文言を明示する。Clerkは複数プロバイダがあるとき
  //   socialButtonsBlockButtonManyInViewが使われ、既定は{{provider|titleize}}
  //   （プロバイダ名のみ）になる。Googleのブランド規約は"Google"単独表記を
  //   認めていないため、「◯◯で続ける」を両方のキーに明示する。
  socialButtonsBlockButton: "{{provider|titleize}}で続ける",
  socialButtonsBlockButtonManyInView: "{{provider|titleize}}で続ける",
  signIn: {
    ...jaJP.signIn,
    start: {
      ...jaJP.signIn?.start,
      title: "すれ違ひ通信にログイン",
      subtitle:
        "X（旧 Twitter）のアカウントで続けます。すれ違いを記録・共有できます。",
    },
  },
  signUp: {
    ...jaJP.signUp,
    start: {
      ...jaJP.signUp?.start,
      title: "はじめての方（新規登録）",
      subtitle: "X（旧 Twitter）で登録すると、すれ違ひ通信をはじめられます。",
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
} satisfies typeof jaJP;
