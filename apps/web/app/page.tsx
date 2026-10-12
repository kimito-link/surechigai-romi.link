import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GuestHomeBenefits } from "@/components/guest-home/GuestHomeBenefits";
import { GuestHomeCta } from "@/components/guest-home/GuestHomeCta";
import { GuestHomeHeader } from "@/components/guest-home/GuestHomeHeader";
import { GuestHomeHero } from "@/components/guest-home/GuestHomeHero";
import { GuestHomeRadar } from "@/components/guest-home/GuestHomeRadar";
import {
  MARKETING_LINK_TEXT,
  MARKETING_URL,
} from "@/lib/guest-home-copy";
import {
  decideGuestHome,
  SHELL_BOUNCE_COOKIE,
} from "@/lib/guest-home-gate";

/**
 * トップ `/` のゲスト画面。
 *
 * ★なぜ Next.js で描き直すか（2026-10-12 実測）:
 *   旧 Expo 版は起動に 5.7〜6.4 秒かかっていた。CPU を絞らなくても 5096ms。
 *   読み込む JS が 8,297KB あり、その実行完了を起動画面が待っていた。
 *   移植済みの /sign-in/ は 234KB で 1543ms。ベールの出し方を変えても消えない差。
 *
 * ★このページはクライアント JS を出さない:
 *   旧版のゲスト画面はデータ取得ゼロ・アニメーションゼロ・画像ゼロだった
 *   （未ログインに tRPC や Clerk の chunk を読ませないための設計）。
 *   そのままサーバーで描けるので "use client" を1つも使わない。
 *   JS を無効にしても全部見えて、CTA が押せる状態が正しい。
 *
 * ★★ `/` はゲスト専用ルートではない:
 *   旧 app/(tabs)/index.tsx は3分岐で、ログイン済みには TabAuthenticatedShell
 *   （投稿一覧・レーダー）を出している。ゲスト画面だけを `/` に出すと、
 *   ログイン済みの人のホームが消える。だから下のゲートで旧側へ返す。
 *   ログイン済み側の移植が終わったら、このゲートは外せる。
 *
 * ★判定をサーバーでやる理由: クライアントで Clerk の読み込みを待つと、
 *   待つあいだゲスト画面が見えてしまう（別の画面が一瞬見える）。
 */

export const metadata: Metadata = {
  title: "君斗りんくのすれ違ひ通信",
  description: "現在地でつながる、すれ違ひ通信。",
};

export default async function GuestHomePage() {
  const jar = await cookies();
  const decision = decideGuestHome({
    cookieHeader: jar.toString(),
    cookieSuffix: undefined,
    returnedFromShell: jar.get(SHELL_BOUNCE_COOKIE)?.value === "1",
  });

  if (decision.kind === "bounce-to-legacy-shell") {
    // 旧 Expo のシェルへ返す。往復は guest-home-gate 側の短命 cookie で1回で止まる。
    redirect(decision.href);
  }

  return (
    <>
      <GuestHomeHeader />
      {/* 固定ヘッダー(68px)の下から始める。下端はホームバーの分だけ空ける。 */}
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pt-[calc(theme(spacing.header)+0.5rem)] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <GuestHomeHero />
        <GuestHomeRadar />
        <GuestHomeBenefits />
        <GuestHomeCta />
        <Link
          href={MARKETING_URL}
          className="flex min-h-touch items-center justify-center text-xs text-ink-muted underline"
        >
          {MARKETING_LINK_TEXT}
        </Link>
      </main>
    </>
  );
}
