import type { VercelRequest, VercelResponse } from "@vercel/node";
import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "../../server/routers/index.js";
import { createContext } from "../../server/_core/context.js";
import { isAllowedOrigin } from "../../server/_core/cors.js";

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

  const url = new URL(req.url ?? "/api/trpc", "https://surechigai-romi.link");
  return decodeURIComponent(url.pathname.replace(/^\/api\/trpc\/?/, ""));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const path = resolveTrpcPath(req);
  if (!path) {
    res.status(404).json({ error: "Missing tRPC path" });
    return;
  }

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
}
