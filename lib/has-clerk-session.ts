import { NON_SESSION_CLERK_STORAGE_KEYS } from "@/lib/clerk-public-routes";

/**
 * Clerk SDK なしで「たぶんログイン済み」を判定（公開 `/u/*` 用・軽量）。
 *
 * ★2026-10-12: 「`__clerk` で始まるキーが1つでもあれば」とすると、ゲストでも Clerk が書く
 *   `__clerk_environment`（環境設定のキャッシュ）に反応して、一度 Clerk を読んだ端末が
 *   永久にログイン済み扱いになる。除外リスト（lib/clerk-public-routes.ts）で外す。
 *   ★条件そのもの（`__clerk` で始まる）は従来のまま。除外だけを足した。
 */
export function hasClerkSessionInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Object.keys(window.localStorage).some(
      (key) => key.startsWith("__clerk") && !NON_SESSION_CLERK_STORAGE_KEYS.includes(key),
    );
  } catch {
    return false;
  }
}
