/**
 * kimito.link のセッションを、ネイティブアプリの Clerk セッションへ渡す。
 *
 * 認証セッション（ASWebAuthenticationSession / Custom Tabs）がこの URL を開く。
 * ログイン済みならワンタイムの sign-in token を作り、`surechigai://` へ 302 する。
 * 未ログインなら kimito.link のサインインへ 302 する（JS 不要）。
 *
 * 戻り先は固定。リクエストの Host や query の URL は使わない（オープンリダイレクトにしない）。
 */
import { createClerkClient } from "@clerk/backend";
import {
  PRODUCTION_ORIGIN,
  NATIVE_AUTH_HANDOFF_PATH,
  decideNativeHandoff,
  formatNativeReturnUrl,
  buildHandoffUrl,
  type HandoffResult,
} from "../shared/kimito-native-auth.js";

const TICKET_TTL_SECONDS = 120;

export type HandoffRequest = {
  cookieHeader?: string;
  tried: boolean;
};

async function readClerkUserId(cookieHeader: string | undefined): Promise<
  { status: "user"; userId: string } | { status: "anonymous" } | { status: "unavailable" }
> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return { status: "unavailable" };
  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim() ||
    "";
  try {
    const headers = new Headers();
    if (cookieHeader) headers.set("cookie", cookieHeader);
    const request = new Request(`${PRODUCTION_ORIGIN}${NATIVE_AUTH_HANDOFF_PATH}`, {
      method: "GET",
      headers,
    });
    const domain = process.env.EXPO_PUBLIC_CLERK_DOMAIN?.trim();
    const isSatellite = process.env.EXPO_PUBLIC_CLERK_IS_SATELLITE === "true";
    const clerk = createClerkClient({
      secretKey,
      ...(publishableKey ? { publishableKey } : {}),
    });
    const state = await clerk.authenticateRequest(request, {
      secretKey,
      ...(publishableKey ? { publishableKey } : {}),
      ...(domain ? { domain } : {}),
      ...(isSatellite ? { isSatellite: true } : {}),
    });
    if (!state.isAuthenticated) return { status: "anonymous" };
    const userId = state.toAuth()?.userId;
    if (!userId) return { status: "anonymous" };
    return { status: "user", userId };
  } catch {
    console.error("[native-auth-handoff] session check failed");
    return { status: "unavailable" };
  }
}

async function createSignInTicket(userId: string): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;
  try {
    const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        expires_in_seconds: TICKET_TTL_SECONDS,
      }),
    });
    if (!res.ok) {
      console.error("[native-auth-handoff] ticket create failed", res.status);
      return null;
    }
    const json = (await res.json()) as { token?: unknown };
    return typeof json.token === "string" ? json.token : null;
  } catch {
    console.error("[native-auth-handoff] ticket create threw");
    return null;
  }
}

export async function handleNativeAuthHandoff(input: HandoffRequest): Promise<HandoffResult> {
  const session = await readClerkUserId(input.cookieHeader);
  if (session.status === "unavailable") {
    return decideNativeHandoff({
      userId: null,
      tried: input.tried,
      ticket: null,
      unavailable: true,
      handoffUrl: buildHandoffUrl(),
      returnUrl: formatNativeReturnUrl(),
    });
  }
  const userId = session.status === "user" ? session.userId : null;
  const ticket = userId ? await createSignInTicket(userId) : null;
  return decideNativeHandoff({
    userId,
    tried: input.tried,
    ticket,
    unavailable: false,
    handoffUrl: buildHandoffUrl(),
    returnUrl: formatNativeReturnUrl(),
  });
}
