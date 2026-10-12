/**
 * `/` — ログイン済みトップ（Phase 2 の最小の殻）。
 *
 * ★サーバーで cookie を読み、ログイン済みヒントがあれば**HTML の時点でログイン済みの殻**を返す。
 *   Clerk JS・tRPC を待たずに最初の絵が出る（旧 Expo 版の「JS 実行 約5.7秒」を避ける狙い）。
 *   ヒントは認証ではない。食い違いは LoggedInTopShell が Clerk の確定後に直す。
 * ★まだ本番に配線していない（vercel.json の rewrites に `/` は無い）。Preview / ローカルで確認する段階。
 */
import { cookies } from "next/headers";
import { LoggedInTopShell } from "@/components/LoggedInTopShell";
import { hasSignedInUatCookie } from "@/lib/session-hint";

// cookie を読むので動的描画（キャッシュさせない＝別人の殻を配らない）。
export const dynamic = "force-dynamic";

export default async function TopPage() {
  const jar = await cookies();
  const hinted = hasSignedInUatCookie(jar.getAll());
  return <LoggedInTopShell hintedSignedIn={hinted} />;
}
