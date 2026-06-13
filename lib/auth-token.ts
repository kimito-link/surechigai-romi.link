import * as Auth from "@/lib/_core/auth";

type TokenGetter = () => Promise<string | null>;

let clerkTokenGetter: TokenGetter | null = null;

/**
 * Register Clerk's getToken so other modules (REST/trpc) can fetch it
 * without importing Clerk hooks directly.
 */
export function registerClerkTokenGetter(getter: TokenGetter): void {
  clerkTokenGetter = getter;
}

export function clearClerkTokenGetter(): void {
  clerkTokenGetter = null;
}

/**
 * Returns the best available auth token:
 * 1. Clerk session token (preferred)
 * 2. Legacy session token stored via Auth.setSessionToken
 */
export async function getAuthToken(): Promise<string | null> {
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) {
        return token;
      }
    } catch (error) {
      console.warn("[AuthToken] clerk token fetch failed:", error);
    }
  }
  return Auth.getSessionToken();
}
