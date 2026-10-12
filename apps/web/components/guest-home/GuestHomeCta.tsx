import Link from "next/link";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/auth-routes";
import {
  CTA_ARIA_LABEL,
  CTA_LABEL,
  CTA_NOTE,
  HEADER_LOGIN_GLYPH,
} from "@/lib/guest-home-copy";

/**
 * ゲストホームの主 CTA。X のワンタップ導線へ送るだけ。
 *
 * ★移植元: components/molecules/kimito-login-cta.tsx（react-native 版）。
 *
 * ★旧版にあった仕掛けを、このページでは持たない:
 *   旧版は useAuth() の isAuthReadyForUI を見て「接続中…」を出し、
 *   4秒のタイムアウトで押せる状態に戻していた。これは 2026-08-21 の
 *   iOS build 520 却下（ボタンが見た目は押せるのに無反応）への対応で、
 *   ★ネイティブでは今も生きている。消してはいけない。
 *   一方このページはサーバーで描くただの <a> なので、押せない時間が存在しない
 *   （href があるので JS が動いていなくても遷移する）。よって持ち込まない。
 *
 * ★行き先は lib/auth-routes.ts の SIGN_IN_AUTO_X_HREF から取る。
 *   手書きの href は kimito で17箇所の不整合を起こした前科がある。
 *
 * ★Contrast Contract（DESIGN.md）: Web の CTA は <a>/Link に背景色を直付けする。
 *   Pressable のような「押せる要素」の見た目に頼らない。
 *   白文字 on #00427B は 10.4:1。
 *
 * ★X のロゴは Unicode の 𝕏（U+1D54F）。画像を増やさない。
 */
export function GuestHomeCta() {
  return (
    <section className="flex flex-col items-center gap-1.5 px-2">
      <Link
        href={SIGN_IN_AUTO_X_HREF}
        aria-label={CTA_ARIA_LABEL}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-kimito-blue px-4 text-[15px] font-extrabold text-white no-underline"
      >
        <span aria-hidden="true" className="text-base font-black">
          {HEADER_LOGIN_GLYPH}
        </span>
        {CTA_LABEL}
      </Link>
      <p className="text-xs text-ink-hint">{CTA_NOTE}</p>
    </section>
  );
}
