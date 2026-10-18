/**
 * app/(auth)/sign-in/[[...sign-in]]/page.tsx — サインインページ（金型）
 *
 * ★出典: kimitolink-linktree（本番稼働中）
 *
 * ★設計の核（CLERK_X_LOGIN_PLAYBOOK §1）:
 *   Clerk 標準の <SignIn /> に**丸投げする**。OAuth 開始・コールバック・
 *   セッション確定はすべて Clerk が処理する。
 *   ★自前の XOauthEntry / sso-callback に置き換えると本番ログインが壊れる
 *     （kimito が db0032a で実際に壊し、eda1133 で標準に戻して復旧した）。
 *
 * ★catch-all（[[...sign-in]]）が必須。Clerk が /sign-in/sso-callback を使うため。
 *
 * ★ちらつきゼロ契約（web-ios-android/templates/web/auth-mode/README.md ④、2026-10-05）:
 *   - `<SignIn fallback={<ClerkMountFallback/>}/>`: Clerk 本体が描かれるまで**同寸**のプレースホルダを置く。
 *     fallback 無しだと Clerk JS が届くまでカードの枠が高さ 0 の帯になり、本体が出た瞬間に下の説明カードが
 *     +486px 跳ねていた（本番 before 実測: qa/evidence/2026-10-05_signin-flicker/before/summary.txt）。
 *   - 到着時に全画面を被せる intro は置かない（handoffOverlay はボタン押下後にだけ描くものに限る）。
 */
import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AutoAdvanceToX } from "@/components/AutoAdvanceToX";
import { AuthPageIntro } from "@/components/AuthPageIntro";
import { AuthPageShell } from "@/components/AuthPageShell";
import { ClerkMountFallback } from "@/components/ClerkMountFallback";
import { isClerkSsoCallback } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "ログイン",
  // ★認証ページは検索結果に出さない。
  robots: { index: false, follow: false },
};

type SignInPageProps = {
  params: Promise<{ "sign-in"?: string[] }>;
};

export default async function SignInPage({ params }: SignInPageProps) {
  const segments = (await params)["sign-in"] ?? [];

  // ★SSO コールバック中は装飾を出さない（戻り処理の邪魔をしない）。
  if (isClerkSsoCallback(segments)) {
    return <SignIn fallback={<ClerkMountFallback mode="sign-in" />} />;
  }

  return (
    <AuthPageShell
      variant="sign-in"
      intro={<AuthPageIntro />}
      cardHeader={
        <div className="flex flex-col items-center bg-[#E2EDF7] px-4 py-3 text-center border-b border-sky-900/10">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-700"
              aria-hidden
            >
              ✓
            </span>
            <span className="text-sm font-extrabold text-[#00427B]">
              パスワード不要・𝕏 または Apple でかんたんログイン
            </span>
          </div>
          <p className="mt-1 text-xs font-extrabold text-[#B84300]">
            下のボタンを押すだけ ↓（初回も自動で登録されます）
          </p>
        </div>
      }
      noticesBelowCard={
        <div className="w-full max-w-md rounded-2xl border border-sky-900/15 bg-white/90 px-4 py-3 text-xs leading-relaxed text-slate-600 shadow-2xs">
          <p className="font-bold text-slate-800">
            🔒 勝手にポストされたり、生座標がそのまま公開されることはありません
          </p>
          <p className="mt-1">
            現在地の公開範囲（市区町村のみ／非公開など）はいつでも切り替えられます。
          </p>
        </div>
      }
    >
      {/* ★?auto=x のときだけ発火して X ボタンへ click を送る。 */}
      <AutoAdvanceToX />
      {/* ★fallback は本物と同寸のプレースホルダ（くるくるにしない。ちらつきゼロ契約）。 */}
      <SignIn fallback={<ClerkMountFallback mode="sign-in" />} />
    </AuthPageShell>
  );
}
