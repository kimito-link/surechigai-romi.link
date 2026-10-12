import Link from "next/link";
import { SIGN_IN_AUTO_X_HREF } from "@/lib/auth-routes";
import {
  APP_NAME,
  HEADER_LOGIN_ARIA_LABEL,
  HEADER_LOGIN_GLYPH,
  HEADER_LOGIN_TEXT,
} from "@/lib/guest-home-copy";

/**
 * ゲストホームの固定ヘッダー（高さ 68px）。左にアプリ名、右にログイン導線。
 *
 * ★移植元: components/post/guest-home-shell-header.tsx（react-native 版）。
 *
 * ★設計の核 — 画面幅の判定を JS から CSS へ移した:
 *   旧版は useWindowDimensions() で幅 360px 未満を判定し、ログインボタンを
 *   グリフだけの丸にしていた。この値は JS が動くまで確定しないので、
 *   サーバーで描いた HTML と食い違う（ハイドレーション不一致）。
 *   min-[360px]: のメディアクエリなら最初のペイントで正しい。
 *
 * ★CTA の行き先は lib/auth-routes.ts の定数から取る。手書きの href は
 *   kimito で17箇所の不整合を起こした前科がある。
 *
 * ★Contrast Contract: Link に背景色を直付けする（DESIGN.md）。
 *   白文字 on #00427B は 10.4:1。
 */
export function GuestHomeHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-header items-center justify-between gap-2 border-b border-kimito-border-soft bg-white px-4">
      <span className="truncate text-base font-bold text-kimito-blue">
        {APP_NAME}
      </span>
      <Link
        href={SIGN_IN_AUTO_X_HREF}
        aria-label={HEADER_LOGIN_ARIA_LABEL}
        className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-full bg-kimito-blue px-4 text-sm font-bold text-white no-underline"
      >
        <span aria-hidden="true" className="text-base font-black">
          {HEADER_LOGIN_GLYPH}
        </span>
        {/* 狭い画面ではグリフだけにする（旧版の glyphOnly と同じ見た目）。 */}
        <span className="hidden min-[360px]:inline">{HEADER_LOGIN_TEXT}</span>
      </Link>
    </header>
  );
}
