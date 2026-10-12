/**
 * `/` — ログイン済みトップ（Phase 2 の最小の殻）。
 *
 * ★サーバーで Clerk の公開 API（`auth()`）を呼び、ログイン済みなら**HTML の時点でログイン済みの殻**を返す。
 *   Clerk JS・tRPC を待たずに最初の絵が出る（旧 Expo 版の「JS 実行 約5.7秒」を避ける狙い）。
 *   Clerk 内部の cookie（`__client_uat` など）は自分で読まない。内部仕様の変更に巻き込まれないため。
 * ★この判定は初期値であって認可ではない。確定後は Clerk JS の値が正（lib/shell-state.ts）。
 * ★まだ本番に配線していない（vercel.json の rewrites に `/` は無い）。
 */
import { auth } from "@clerk/nextjs/server";
import { LoggedInTopShell } from "@/components/LoggedInTopShell";

// 人ごとに違う絵を返すので、キャッシュさせない。
export const dynamic = "force-dynamic";

export default async function TopPage() {
  const { userId } = await auth();
  return <LoggedInTopShell serverSignedIn={userId !== null} />;
}
