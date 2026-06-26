/**
 * server/routers/auth.ts
 * 
 * 認証関連のルーター
 */
import { COOKIE_NAME } from "../../shared/const.js";
import { verifyToken } from "@clerk/backend";
import { decodeJwt, decodeProtectedHeader } from "jose";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { publicProcedure, router } from "../_core/trpc.js";

function getBearerToken(req: { headers: { authorization?: string | string[] } }): string | null {
  const authHeader = req.headers.authorization;
  const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (typeof value === "string" && value.startsWith("Bearer ")) {
    return value.slice("Bearer ".length).trim();
  }
  return null;
}

function safeError(error: unknown) {
  const err = error as { code?: string; message?: string; reason?: string };
  const secretKey = process.env.CLERK_SECRET_KEY;
  const rawMessage = err.message ? String(err.message) : undefined;
  const message =
    rawMessage && secretKey
      ? rawMessage.replaceAll(secretKey, "[redacted]")
      : rawMessage;

  return {
    code: err.code,
    reason: err.reason,
    message,
  };
}

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  debugToken: publicProcedure.query(async ({ ctx }) => {
    const token = getBearerToken(ctx.req);
    if (!token) {
      return {
        hasBearer: false,
        hasClerkSecret: !!process.env.CLERK_SECRET_KEY?.trim(),
        hasPublishableKey: !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
      };
    }

    let decoded:
      | {
          alg?: string;
          kidPresent: boolean;
          iss?: string;
          azp?: string;
          aud?: string | string[];
          subPresent: boolean;
          exp?: number;
          nbf?: number;
          iat?: number;
        }
      | { decodeError: string };

    try {
      const header = decodeProtectedHeader(token);
      const payload = decodeJwt(token);
      decoded = {
        alg: header.alg,
        kidPresent: !!header.kid,
        iss: typeof payload.iss === "string" ? payload.iss : undefined,
        azp: typeof payload.azp === "string" ? payload.azp : undefined,
        aud: payload.aud,
        subPresent: typeof payload.sub === "string" && payload.sub.length > 0,
        exp: payload.exp,
        nbf: payload.nbf,
        iat: payload.iat,
      };
    } catch (error) {
      decoded = { decodeError: safeError(error).message ?? "decode failed" };
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey?.trim()) {
      return {
        hasBearer: true,
        hasClerkSecret: false,
        hasPublishableKey: !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
        decoded,
        verify: { ok: false, error: { message: "CLERK_SECRET_KEY is missing" } },
      };
    }

    try {
      const payload = await verifyToken(token, { secretKey });
      return {
        hasBearer: true,
        hasClerkSecret: true,
        hasPublishableKey: !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
        decoded,
        verify: {
          ok: true,
          subPresent: typeof payload.sub === "string" && payload.sub.length > 0,
          iss: payload.iss,
          azp: typeof payload.azp === "string" ? payload.azp : undefined,
          exp: payload.exp,
        },
      };
    } catch (error) {
      return {
        hasBearer: true,
        hasClerkSecret: true,
        hasPublishableKey: !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
        decoded,
        verify: { ok: false, error: safeError(error) },
      };
    }
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
