/**
 * AuthPageIntro — サインイン画面の左カラム（サービス紹介）
 *
 * ★出典: kimitolink-linktree/components/AuthPageIntro.tsx
 *   「移植すべきは配置の順序」（AuthPageShell.tsxのコメント参照）に従い、
 *   骨組みを踏襲しつつ中身をすれ違ひ通信のものに差し替えた。
 *
 * ★sign-up variantは持たない（2026-10-02確定）: surechigaiはサインアップ専用
 *   ページを持たない設計（lib/auth-routes.ts の SIGN_UP_HREF = SIGN_IN_HREF 参照）。
 *   X OAuthだけのログインでは、Clerkの<SignIn/>が初回ユーザーも既存ユーザーも
 *   同じ画面で扱うため、sign-in/sign-upを文言レベルで分ける意味が無い。
 */
import Image from "next/image";

const MASCOTS = [
  { src: "/chara/link.png", name: "ゆっくりリンク" },
  { src: "/chara/konta.png", name: "こん太" },
  { src: "/chara/tanunee.png", name: "たぬ姉" },
] as const;

export function AuthPageIntro() {
  return (
    <section
      className="w-full max-w-xl overflow-hidden rounded-4xl border border-sky-900/15 bg-white/95 shadow-xs text-left"
      aria-labelledby="auth-intro-heading"
    >
      <div className="bg-linear-to-br from-sky-50 via-white to-orange-50 px-5 pb-6 pt-6 sm:px-6">
        <p className="mx-auto w-fit rounded-full bg-white/90 px-4 py-1.5 text-center text-sm font-bold text-sky-900 shadow-xs ring-1 ring-sky-900/10 sm:text-base">
          おかえり〜！待ってたよ
        </p>
        <ul className="mt-4 flex items-end justify-center gap-3 sm:gap-5">
          {MASCOTS.map((m) => (
            <li key={m.name} className="flex flex-col items-center">
              <Image
                src={m.src}
                alt={m.name}
                width={128}
                height={128}
                sizes="128px"
                className="h-24 w-24 object-contain drop-shadow-xs sm:h-28 sm:w-28"
                priority={false}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 sm:text-sm">
          君斗りんくのすれ違ひ通信
        </p>
        <h1
          id="auth-intro-heading"
          className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl leading-snug"
        >
          現在地でつながる、すれ違ひ通信
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg leading-relaxed">
          キミの現在地を刻む、すれ違い記録アプリ。ログインは{" "}
          <strong className="font-semibold text-slate-800">
            X（旧 Twitter）のアカウントだけ
          </strong>
          。新しいパスワードはいりません。はじめての方もこのまま X で続ければ、
          自動でアカウントが作られます。
        </p>

        <h2 className="mt-5 text-sm font-bold text-slate-900 sm:text-base">
          ログイン後にできること
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-600 sm:text-base leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              <strong className="font-medium text-slate-800">現在地</strong>
              を記録して、すれ違った場所を振り返る
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              すれ違い履歴を
              <strong className="font-medium text-slate-800">
                マイページ
              </strong>
              で一覧表示
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              X アカウントのプロフィールと連携して、
              <strong className="font-medium text-slate-800">
                だれにすれ違ったか
              </strong>
              を記録
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
