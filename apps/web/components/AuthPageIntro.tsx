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
          同じ聖地・イベント・街を歩いた{" "}
          <strong className="font-semibold text-slate-800">
            同じ興味関心の 𝕏 ユーザー
          </strong>
          と交差してフォロワーが増える位置記録アプリ。ログインは{" "}
          <strong className="font-semibold text-slate-800">
            𝕏（旧 Twitter）または Apple のアカウントだけ
          </strong>
          。新しいパスワードは不要で、はじめての方も1タップで自動登録されます。
        </p>

        <h2 className="mt-5 text-sm font-bold text-slate-900 sm:text-base">
          ログイン後にすぐできること
        </h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-600 sm:text-base leading-relaxed">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-bold text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              <strong className="font-semibold text-slate-800">
                顔アイコン入り「現在地絵札（OGP）」
              </strong>
              を 𝕏 に1タップ共有し、同じ界隈の仲間に見つけてもらえる
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-bold text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              同じ場所を通った人と30日タイムシフトで
              <strong className="font-semibold text-slate-800">
                すれ違ひ成立
              </strong>
              ・興味タグ（#推し活 #聖地巡礼）でつながる
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-bold text-sky-900" aria-hidden>
              ✓
            </span>
            <span>
              歩いた都道府県の
              <strong className="font-semibold text-slate-800">
                全国図鑑＆すれ違ひランキング
              </strong>
              が育ち、マイページで軌跡を振り返れる
            </span>
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-sm font-bold text-sky-900">
          <a href="/" className="underline hover:text-sky-700">
            ← アプリトップへ戻る
          </a>
          <a href="/lp/" className="underline hover:text-sky-700">
            サービス紹介（LP）
          </a>
          <a href="/special-thanks" className="underline hover:text-sky-700">
            特別協力
          </a>
        </div>
      </div>
    </section>
  );
}
