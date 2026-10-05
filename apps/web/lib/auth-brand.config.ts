/**
 * 認証金型のブランド設定（Next.js + Clerk 版）
 *
 * ★この1ファイルだけを自プロジェクト用に書き換える。
 *   他の *.tsx.example はこの設定を読むので、原則そのままコピーしてよい。
 *
 * 出典: kimitolink-linktree（Next.js 16 + @clerk/nextjs 7 + App Router）。
 *   2026-10-01 に実機でコンソールエラー0・ちらつき無しを確認した実装を金型化したもの。
 *   正本KB: ai-generic-rules/docs/policies/CLERK_X_LOGIN_PLAYBOOK.md
 */

export type AuthBrandConfig = {
  /** 認証後の着地先。FORCE/FALLBACK 両方に使う（末尾スラッシュ込みで書く）。 */
  afterAuthPath: string;
  /** サインイン／サインアップのルート（末尾スラッシュ込み）。 */
  signInPath: string;
  signUpPath: string;
  /** サインアウト後の着地先。 */
  afterSignOutPath: string;

  /**
   * ★共通アカウントで「ログイン後に戻ってよい」オリジン。
   *   ここに無いサービスへは**沈黙して戻れない**（エラーも出ない）。
   *   サブドメイン方式なら cookie 共有で動く「はず」だが、
   *   それは未検証の理論なので明示列挙する（kimito が 2026-08-28 に明示化した判断）。
   */
  allowedRedirectOrigins: string[];
  /** 開発時のみ追加で許可するオリジン。 */
  developmentRedirectOrigins: string[];

  /** Clerk の FAPI ドメイン（preconnect に使う）。例: clerk.example.com */
  clerkFrontendApiDomain: string;

  /**
   * Clerk 本体が描かれるまで置く同寸プレースホルダ（components/ClerkMountFallback.tsx）の設定。
   * ★出典: web-ios-android/templates/web/auth-mode/nextjs/auth-brand.config.ts.example（ちらつきゼロ契約 ②）。
   */
  clerkCard: {
    /** カード左上のロゴ。clerk-appearance.ts の logoImageUrl と同じ画像（実際に配信されているパス） */
    logoSrc: string;
    /**
     * 本番 Clerk Dashboard のソーシャルプロバイダ（表示順）。hero は主役ボタン（黒地、appearance の heroButton）。
     * ★Dashboard で増減したらここも合わせる（数が違うとボタン 1 個ぶん 58px ずつ縦ずれが戻る）。
     */
    providers: { key: string; title: string; hero: boolean }[];
  };

  /**
   * ワンタップ遷移中のフルスクリーン表示。
   * ★画像を出さないなら image を null にする（金型は画像なしでも動く）。
   */
  autoAdvance: {
    /** 待機画面に出すキャラ/ロゴ画像。null なら画像を描画しない。 */
    image: { src: string; alt: string; width: number; height: number } | null;
    /** 背景色の Tailwind クラス（例: "bg-blue-900"）。 */
    backgroundClass: string;
    /** プログレスバーの色クラス（例: "bg-orange-500"）。 */
    accentClass: string;
    /** 見出し・補足文（自サービスの言葉に書き換える）。 */
    headline: string;
    subline: string;
    /** X の Sensitive permissions 警告への先出し案内。不要なら null。 */
    sensitiveNotice: string | null;
  };
};

/**
 * ★ここから下を自プロジェクト用に書き換える。
 *   下記は kimito.link の実値（動作実績あり）をそのまま例示している。
 */
export const authBrandConfig: AuthBrandConfig = {
  /**
   * ★すれ違い通信は自分のトップに戻る（kimito.link の /dashboard/ ではない）。
   *   本番 /api/health の expectedPostAuthPath: "/" で実測確認（2026-10-01）。
   *   ★姉妹サービスは「自オリジンの sign-in ＋ 自分の着地先」で揃える。
   *     kimito.link へ送客すると signInForceRedirectUrl で戻れなくなる。
   */
  afterAuthPath: "/",
  signInPath: "/sign-in/",
  signUpPath: "/sign-up/",
  // 既存実装に合わせる（lib/header-user-button-props.ts:21 の afterSignOutUrl）。
  afterSignOutPath: "/logout",

  allowedRedirectOrigins: [
    "https://kimito.link",
    "https://doin.kimito.link",
    "https://voice.kimito.link",
    "https://exosome.kimito.link",
    // 旧・別ドメイン（移行期のため残す。廃止が確定したら外す）
    "https://surechigai-romi.link",
    "https://doin-challenge.com",
  ],
  developmentRedirectOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],

  clerkFrontendApiDomain: "clerk.kimito.link",

  clerkCard: {
    // clerk-appearance.ts の options.logoImageUrl と同じ。
    logoSrc: "/pwa-icon-192.png",
    // https://surechigai.kimito.link/sign-in/ の本番 DOM を 2026-10-05 に実測した構成
    // （.cl-socialButtonsBlockButton__x / __apple / __google の 3 つ。X は appearance の order:-1 で先頭）。
    providers: [
      { key: "x", title: "X / Twitter", hero: true },
      { key: "apple", title: "Apple", hero: false },
      { key: "google", title: "Google", hero: false },
    ],
  },

  autoAdvance: {
    // ★画像は Phase 1 では出さない（既存アセットの移植は後続ステップ）。
    //   金型は image: null でも動く設計。
    image: null,
    backgroundClass: "bg-slate-900",
    accentClass: "bg-sky-500",
    headline: "Xの画面へ進んでいます…",
    subline: "いまブラウザの X アカウントで入ります。",
    sensitiveNotice:
      "Sensitive permissions が出たら I trust this app にチェックして許可してください。",
  },
};
