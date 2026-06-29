const DEFAULT_POST_AUTH_REDIRECT = "/";

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return false;
  if (/\s/.test(value)) return false;
  return true;
}

function isAuthEntryPath(value: string): boolean {
  const pathname = value.split("?", 1)[0].toLowerCase();
  return (
    pathname === "/sign-in" ||
    pathname === "/sign-in/" ||
    pathname === "/sign-up" ||
    pathname === "/sign-up/"
  );
}

/** OAuth 完了後の戻り先を安全な内部パスに制限する。 */
export function normalizePostAuthRedirect(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_POST_AUTH_REDIRECT;
  const normalized = raw.trim();
  if (!isSafeInternalPath(normalized)) return DEFAULT_POST_AUTH_REDIRECT;
  if (isAuthEntryPath(normalized)) return DEFAULT_POST_AUTH_REDIRECT;
  return normalized;
}
