/** 初回オンボーディングを出さないパス */
export function shouldSkipOnboarding(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;

  if (path.startsWith("/u/")) return true;
  if (path.startsWith("/lp")) return true;
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) return true;
  if (path === "/admin" || path.startsWith("/admin/")) return true;

  return false;
}
