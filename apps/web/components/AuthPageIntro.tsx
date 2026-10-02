/**
 * AuthPageIntro — サインイン画面の左カラム（サービス紹介）
 *
 * ★出典: kimitolink-linktree/components/AuthPageIntro.tsx
 *   「移植すべきは配置の順序」（AuthPageShell.tsxのコメント参照）に従い、
 *   骨組みを踏襲しつつ中身をすれ違ひ通信のものに差し替えた。
 */
import Image from "next/image";
import Link from "next/link";

type AuthPageIntroProps = {
  variant: "sign-in" | "sign-up";
};

const MASCOTS = [
  { src: "/chara/link.png", name: "ゆっくりリンク" },
  { src: "/chara/konta.png", name: "こん太" },
  { src: "/chara/tanunee.png", name: "たぬ姉" },
] as const;

export function AuthPageIntro({ variant }: AuthPageIntroProps) {
  const isSignIn = variant === "sign-in";

  return (
    <section
      className="w-full max-w-xl overflow-hidden rounded-4xl border border-sky-900/15 bg-white/95 shadow-xs text-left"
      aria-labelledby="auth-intro-heading"
    >
      <div className="bg-linear-to-br from-sky-50 via-white to-orange-50 px-5 pb-6 pt-6 sm:px-6">
        <p className="mx-auto w-fit rounded-full bg-white/90 px-4 py-1.5 text-center text-sm font-bold text-sky-900 shadow-xs ring-1 ring-sky-900/10 sm:text-base">
          {isSignIn ? "おかえり〜！待ってたよ" : "はじめまして！"}
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
          {isSignIn
            ? "現在地でつながる、すれ違ひ通信"
            : "X アカウントひとつで、すれ違ひ通信をはじめる"}
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg leading-relaxed">
          キミの現在地を刻む、すれ違い記録アプリ。ログインは{" "}
          <strong className="font-semibold text-slate-800">
            X（旧 Twitter）のアカウントだけ
          </strong>
          。新しいパスワードはいりません。
        </p>

        <h2 className="mt-5 text-sm font-bold text-slate-900 sm:text-base">
          {isSignIn ? "ログイン後にできること" : "登録後にできること"}
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

        {!isSignIn ? (
          <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/sign-in/"
              className="font-semibold text-sky-900 underline underline-offset-2"
            >
              ログイン
            </Link>
            へ。
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
            はじめての方は{" "}
            <Link
              href="/sign-up/"
              className="font-semibold text-sky-900 underline underline-offset-2"
            >
              新規登録（無料）
            </Link>
            から。
          </p>
        )}
      </div>
    </section>
  );
}
