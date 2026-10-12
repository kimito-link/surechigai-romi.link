"use client";

/**
 * ログイン済みトップ（`/`）の殻。
 *
 * ■ 表示の決め方（ちらつきを作らない）
 *   - サーバーが cookie から「ログイン済みヒント」を渡す（hintedSignedIn）。ヒントありなら**最初の HTML から**
 *     ログイン済みの殻を出す。ゲスト画面→ログイン済み画面の切り替わりを見せない。
 *   - Clerk が確定したら実際の状態に合わせる。ヒントと食い違い（ヒントあり→実はゲスト）のときだけ
 *     ゲスト表示へ直す。ヒントなしでゲストの人は最初からゲスト表示（ここでは待たせない）。
 *   - ヒントなし（cookie が無い／'0'）は、Clerk の確定を待たず最初からゲスト表示（待機画面は挟まない）。
 *
 * ■ デザイン（DESIGN.md）
 *   ヒーローは「キミの／現在地／を、刻む。」の3段で「現在地」だけ橙。★ヒーローにアプリ名は出さない
 *   （ヘッダーに既にある）。「すれ違ひ」は旧仮名。本文は #0F172A / #00427B を #E2EDF7 地に載せる
 *   （Contrast Contract: 4.5:1 以上。橙は大文字（3:1 基準）にだけ使う）。
 *
 * ■ 範囲（Phase 2 の最小の殻）
 *   ポスト本体（レーダー・tRPC）はまだ移していない。タブは移行前の旧 Expo 画面への通常リンク。
 */
import { useAuth, useUser } from "@clerk/nextjs";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/auth-routes";

const TABS = [
  { href: "/", label: "ポスト", current: true },
  { href: "/checkin", label: "現在地", current: false },
  { href: "/zukan", label: "さがす", current: false },
  { href: "/map", label: "軌跡", current: false },
  { href: "/mypage", label: "マイページ", current: false },
] as const;

type Props = {
  /** サーバーが cookie（__client_uat）から判定した「ログイン済みかも」。認証ではない。 */
  hintedSignedIn: boolean;
};

export function LoggedInTopShell({ hintedSignedIn }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  // 確定後の状態。未確定の間はヒントに従う。
  const showSignedIn = isLoaded ? isSignedIn === true : hintedSignedIn;

  return (
    <div className="flex min-h-dvh flex-col bg-[#E2EDF7] text-[#0F172A]">
      <header className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <span className="text-[15px] font-bold text-[#00427B]">君斗りんくのすれ違ひ通信</span>
        {showSignedIn ? <SignedInName enabled={isLoaded} /> : null}
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 pb-8">
        <>
            <h1 className="text-[44px] leading-[1.15] font-black text-[#00427B]">
              <span className="block">キミの</span>
              <span className="block text-[56px] text-[#DD6500]">現在地</span>
              <span className="block">を、刻む。</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#0F172A]">
              現在地でつながる、すれ違ひ通信。正確な場所を残して、あとでたどれる。
            </p>
            {showSignedIn ? (
              <a
                href="/checkin"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#00427B] px-8 text-[16px] font-bold text-white"
              >
                現在地を刻む
              </a>
            ) : (
              <a
                href={SIGN_IN_AUTO_X_HREF}
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#0F1419] px-8 text-[16px] font-bold text-white"
              >
                Xでログインして始める
              </a>
            )}
        </>
      </main>

      {showSignedIn ? (
        <nav
          aria-label="メインメニュー"
          className="grid grid-cols-5 border-t border-[#00427B]/20 bg-white pb-[max(env(safe-area-inset-bottom),8px)]"
        >
          {TABS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center text-[11px] font-bold ${
                t.current ? "text-[#00427B]" : "text-[#0F172A]"
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

/** ログイン中の表示名。Clerk 確定前は場所だけ確保して、確定時に横幅が跳ねないようにする。 */
function SignedInName({ enabled }: { enabled: boolean }) {
  const { user } = useUser();
  const name = enabled ? (user?.username ?? user?.firstName ?? "") : "";
  return (
    <span className="min-h-5 max-w-[40%] truncate text-[13px] text-[#0F172A]" aria-live="polite">
      {name}
    </span>
  );
}
