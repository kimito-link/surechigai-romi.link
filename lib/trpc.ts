import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import { getAuthToken, registerClerkTokenGetter } from "@/lib/auth-token";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside the link,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 *
 * httpBatchLink: 標準HTTP link。
 * 位置送信や認証必須mutationを扱うため、ストリーミング応答ではなく通常JSON応答に固定する。
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get access token from localStorage (Web) or SecureStore (Native)
 * This is used for cross-origin requests where cookies don't work
 */
export const setClerkTokenGetter = registerClerkTokenGetter;

type TokenGetter = () => Promise<string | null>;

async function getAccessToken(): Promise<string | null> {
  try {
    return await getAuthToken();
  } catch (error) {
    console.error("[tRPC] Failed to get access token:", error);
    return null;
  }
}

async function resolveAccessToken(options: { getToken?: TokenGetter }): Promise<string | null> {
  if (options.getToken) {
    try {
      const token = await options.getToken();
      if (token) return token;
    } catch (error) {
      console.error("[tRPC] Failed to get Clerk token:", error);
    }
  }
  return getAccessToken();
}

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient(options: { getToken?: TokenGetter } = {}) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside link, not at root
        transformer: superjson,
        async headers() {
          const token = await resolveAccessToken(options);
          if (token) {
            return { Authorization: `Bearer ${token}` };
          }
          return {};
        },
        // Custom fetch to include credentials for cookie-based auth (fallback)
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
