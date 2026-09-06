/**
 * modules/event/core/safe-url.ts
 *
 * ユーザーが入力したURL（集まりのオンライン会場）が保存してよい形か検証する。
 *
 * ★なぜ必要か（2026-09-06 に発見）:
 *   入口の検証は `z.string().url()` だけだったが、これは
 *   `javascript:alert(1)` や `data:text/html,<script>…` を**通してしまう**
 *   （zod 4.5.4 で実測確認）。集まりは誰でも作れて onlineUrl は他人に表示されるため、
 *   他人が作った集まりを開いただけで任意コードを踏まされうる状態だった。
 *
 * ★ドメイン列挙をしない理由:
 *   会議URLは Zoom / Meet / Teams / 自社システムと無数にあり列挙は破綻する。
 *   見るべきは「誰のドメインか」ではなく「スキームが危険でないか」。
 *
 * ★クライアント側の同等物は lib/navigation/external-links.ts の
 *   isSafeUserProvidedUrl。あちらは react-native に依存するのでサーバーから使えず、
 *   判定だけを持つこのファイルを別に置いている（入口と出口の両方で守る）。
 */

/** https のURLとして安全に開ける形か */
export function isSafeEventUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (!parsed.hostname) return false;
  return true;
}
