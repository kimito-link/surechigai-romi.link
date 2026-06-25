import { createTRPCReact } from "@trpc/react-query";
import { httpBatchStreamLink } from "@trpc/client";
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
 * httpBatchStreamLink: レスポンスを順次ストリーミングし、
 * 遅いクエリを待たずに速いクエリから表示できる。
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

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient(options: { getToken?: TokenGetter } = {}) {
  return trpc.createClient({
    links: [
      httpBatchStreamLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside link, not at root
        transformer: superjson,
        async headers() {
          const token = options.getToken
            ? await options.getToken().catch((error) => {
                console.error("[tRPC] Failed to get Clerk token:", error);
                return null;
              })
            : await getAccessToken();
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
