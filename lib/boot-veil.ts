/**
 * ブートベール（app/+html.tsx の #romi-boot-veil）の解除。
 *
 * ベールは、ホーム画面から開いた(PWA)ときやログイン済みヒントがあるとき、起動直後に
 * ロゴ付きの画面を前面に出して、プリレンダ済みのゲスト用HTMLを見せないためのもの。
 *
 * ★2026-10-05 解除のタイミングを「ルートのレイアウトのマウント」から
 *   「トップ画面（/）の中身のマウント」へ移した。理由:
 *   ルートのレイアウトがマウントしても、タブの画面（チャンク）はまだ読み込み中で、
 *   ベールを外すと「空白（タブバーだけ）」が露出し、そのあと本編が出ていた。
 *   実測（scripts/qa/measure-launch-timeline.mjs、本番をPWA起動に見立てて測定）:
 *   ベール解除から本編まで ゲストで約350ms / ログイン済みヒントで約570ms の空白。
 *   実機（iPhone・Androidとも）の画面録画でも、ベール → 空白 → 本編 と見えていた。
 * ★/ 以外の画面（ログイン等）は従来どおりルートのレイアウトで外す。
 * ★解除し忘れても、+html.tsx 側の保険（6秒で自動解除）がある。
 * ★app/+html.tsx のコメントに残る「解除は app/_layout.tsx の releaseBootVeil()」は、この移動より前の記述。
 *   実装はこのファイルが正（呼び出しは app/(tabs)/index.tsx と app/_layout.tsx）。
 */

/** トップ画面（/）か。ここでは画面自身が解除を呼ぶので、ルートのレイアウトは外さない。 */
export function isBootVeilReleasedByLandingScreen(pathname: string | null | undefined): boolean {
  if (typeof pathname !== "string") return false;
  const p = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return p === "" || p === "/index";
}

/**
 * ベール（data-auth-boot）を外す。React のマウントは「描画が終わった」ことを意味しないので、
 * 2フレーム待ってから外す（2026-08-16 の実機録画で、1フレームでは足りないと確認済み）。
 * Web 以外（document が無い環境）では何もしない。何度呼んでも安全。
 */
export function releaseBootVeil(): void {
  if (typeof document === "undefined") return;

  const remove = () => document.documentElement.removeAttribute("data-auth-boot");

  if (typeof requestAnimationFrame !== "function") {
    remove();
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(remove));
}
