import { jaJP } from "@clerk/localizations";

/**
 * Clerk 公式の日本語（jaJP）をベースに、見出しだけ「君斗りんくのすれ違ひ通信」向けに補足。
 * kimito.link の clerk-localization.ts に準拠。
 */
export const kimitoJaJP = {
  ...jaJP,

  // ★ソーシャルボタンの文言を明示する（2026-08-09・kimitolink-linktree 4229014 から輸入）。
  //   Clerk は blockButton 表示のときプロバイダ名だけ（"Google" / "X / Twitter"）を出すが、
  //   Google のブランド規約は**"Google" 単独表記を認めていない**（承認文言は
  //   "Sign in with Google" / "Sign up with Google" / "Continue with Google" の3つ）。
  //   日本語ではこれに対応する「◯◯で続ける」を明示する。
  //   {{provider|titleize}} は Clerk がプロバイダ名に置換するテンプレート。
  //
  //   ★キーは2つある。linktree が実DOMを調べたところ、**プロバイダが複数あるときは
  //   `socialButtonsBlockButtonManyInView` が使われ**、その既定は
  //   `{{provider|titleize}}`（＝プロバイダ名のみ）だった。これが「Google」単独表示の正体。
  //   両方指定しないと効かない。
  socialButtonsBlockButton: "{{provider|titleize}}で続ける",
  socialButtonsBlockButtonManyInView: "{{provider|titleize}}で続ける",
  signIn: {
    ...jaJP.signIn,
    start: {
      ...jaJP.signIn?.start,
      title: "君斗りんくのすれ違ひ通信にログイン",
      // 実際に並ぶのは X / Apple / Google の3つ。「X または Apple」と書くと
      // Google だけ案内から漏れ、Google の "at least as prominently" 要件にも反する。
      subtitle:
        "X・Apple・Google のいずれかで続けます。すれ違いの記録はログイン後に残せます。",
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
