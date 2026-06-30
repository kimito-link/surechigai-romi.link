/** Clerk SDK なしで「たぶんログイン済み」を判定（公開 `/u/*` 用・軽量）。 */
export function hasClerkSessionInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith("__clerk"));
  } catch {
    return false;
  }
}
