import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { isAllowedOrigin } from "../../server/_core/cors.js";

const REQUEST_TIMEOUT_MS = 24_000;
const RATE_LIMIT_CACHE_MAX = 10_000;

type RateLimitRule = {
  pattern: RegExp;
  windowMs: number;
  max: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const expensivePathRules: RateLimitRule[] = [
  { pattern: /^presence\.pulse$/, windowMs: 30_000, max: 1 },
  { pattern: /^encounter\.checkIn$/, windowMs: 30_000, max: 4 },
  { pattern: /^visit\.report$/, windowMs: 20_000, max: 1 },
  { pattern: /^event\.resolveOfflineLocation$/, windowMs: 20_000, max: 1 },
  { pattern: /^zukan\.activePrefectures$/, windowMs: 5_000, max: 3 },
  { pattern: /^zukan\.creatorsByPrefecture$/, windowMs: 5_000, max: 3 },
  { pattern: /^ogp\.getTrailBySlug$/, windowMs: 5_000, max: 5 },
  { pattern: /^ogp\.getShareBySlug$/, windowMs: 5_000, max: 5 },
];

const rateLimitByKey = new Map<string, RateLimitEntry>();

function applyCors(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function resolveTrpcPath(req: VercelRequest): string {
  const routeParam = req.query.trpc;
  if (Array.isArray(routeParam)) return routeParam.join("/");
  if (typeof routeParam === "string") return routeParam;

  const url = new URL(req.url ?? "/api/trpc", "https://surechigai.kimito.link");
  return decodeURIComponent(url.pathname.replace(/^\/api\/trpc\/?/, ""));
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(",")[0]?.trim() || undefined;
}

function getClientIp(req: VercelRequest): string {
  return (
    firstHeaderValue(req.headers["cf-connecting-ip"]) ||
    firstHeaderValue(req.headers["x-real-ip"]) ||
    firstHeaderValue(req.headers["x-forwarded-for"]) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function getRateLimitIdentity(req: VercelRequest): string {
  const auth = firstHeaderValue(req.headers.authorization);
  const bearer = auth?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    const digest = createHash("sha256").update(bearer).digest("hex").slice(0, 16);
    return `auth:${digest}`;
  }
  return `ip:${getClientIp(req)}`;
}

function splitTrpcPaths(path: string): string[] {
  return path
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanupRateLimitCache(now: number): void {
  if (rateLimitByKey.size <= RATE_LIMIT_CACHE_MAX) return;
  for (const [key, entry] of rateLimitByKey) {
    if (entry.resetAt <= now) {
      rateLimitByKey.delete(key);
    }
  }
}

function checkRateLimit(path: string, req: VercelRequest) {
  const now = Date.now();
  cleanupRateLimitCache(now);

  const identity = getRateLimitIdentity(req);
  for (const trpcPath of splitTrpcPaths(path)) {
    const rule = expensivePathRules.find((item) => item.pattern.test(trpcPath));
    if (!rule) continue;

    const key = `${identity}:${trpcPath}`;
    const existing = rateLimitByKey.get(key);
    if (!existing || existing.resetAt <= now) {
      rateLimitByKey.set(key, { count: 1, resetAt: now + rule.windowMs });
      continue;
    }

    if (existing.count >= rule.max) {
      return {
        path: trpcPath,
        retryAfterMs: existing.resetAt - now,
      };
    }

    existing.count += 1;
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const path = resolveTrpcPath(req);
  const startedAt = Date.now();
  const timeout = setTimeout(() => {
    console.error("[api/trpc] timeout guard", {
      path,
      method: req.method,
      durationMs: Date.now() - startedAt,
    });
    if (!res.headersSent) {
      res.status(503).json({ error: "tRPC timeout guard", path });
    }
  }, REQUEST_TIMEOUT_MS);
  res.once("finish", () => {
    clearTimeout(timeout);
    const durationMs = Date.now() - startedAt;
    if (durationMs >= 2_000 || res.statusCode >= 500) {
      console.warn("[api/trpc] request finished", {
        path,
        method: req.method,
        statusCode: res.statusCode,
        durationMs,
      });
    }
  });

  if (!path) {
    res.status(404).json({ error: "Missing tRPC path" });
    return;
  }

  const rateLimit = checkRateLimit(path, req);
  if (rateLimit) {
    const retryAfter = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    // tRPC(httpBatchLink+superjson)が解釈できるエラーエンベロープで返す(P1-2)。
    // 素のJSON({error:"rate_limited"})はクライアントのリンク層で解釈できず
    // 「予期しないエラー」に化けていた。この形なら toUserFriendlyError が
    // TOO_MANY_REQUESTS/httpStatus:429 を拾って待機メッセージを出す。
    const errorItem = (p: string) => ({
      error: {
        json: {
          message: "リクエストが多すぎます。しばらく待ってから再度お試しください。",
          code: -32029, // TRPC_ERROR_CODES_BY_KEY.TOO_MANY_REQUESTS
          data: {
            code: "TOO_MANY_REQUESTS",
            httpStatus: 429,
            path: p,
            retryAfter,
          },
        },
      },
    });
    const isBatch = req.query?.batch === "1";
    const paths = String(path).split(",");
    res.status(429).json(isBatch ? paths.map((p) => errorItem(p)) : errorItem(path));
    return;
  }

  try {
    const { nodeHTTPRequestHandler } =
      await import("@trpc/server/adapters/node-http");
    const { appRouter } = await import("../../server/routers/index.js");
    const { createContext } = await import("../../server/_core/context.js");

    await nodeHTTPRequestHandler({
      router: appRouter,
      req,
      res,
      path,
      createContext: (opts) =>
        createContext(opts as unknown as Parameters<typeof createContext>[0]),
      maxBodySize: 50 * 1024 * 1024,
      onError({ error, path: errorPath }) {
        console.error("[api/trpc]", errorPath, error);
      },
    });
  } catch (error) {
    console.error("[api/trpc] handler failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "tRPC unavailable" });
    }
  }
}
