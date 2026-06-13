import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { readBuildInfo } from "./health";
import { APP_VERSION } from "../../shared/version";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { registerOAuthRoutes } from "./oauth";
import { registerTwitterRoutes } from "../twitter-routes";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getDashboardSummary, getApiUsageStats } from "../api-usage-tracker";
import { getErrorLogs, getErrorStats, resolveError, resolveAllErrors, clearErrorLogs, errorTrackingMiddleware } from "../error-tracker";
import { checkSchemaIntegrity, notifySchemaIssue, type SchemaCheckResult } from "../schema-check";
import { getOpenApiSpec } from "../openapi";
import swaggerUi from "swagger-ui-express";
import { initWebSocketServer } from "../websocket";
import { initSentry, Sentry } from "./sentry";
import { rateLimiterMiddleware } from "./rate-limiter";
import { verifyAdminPassword } from "../admin-password-auth";
import { getSessionCookieOptions } from "./cookies";
import type { Request, Response } from "express";
import { SESSION_MAX_AGE_MS } from "../../shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

import { isAllowedOrigin } from "./cors";
export { isAllowedOrigin } from "./cors";

async function startServer() {
  // Initialize Sentry for error tracking
  initSentry();

  const app = express();
  const server = createServer(app);

  // Sentry request handler must be the first middleware (no-op for now)
  // Error handler will be added at the end

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // セキュリティヘッダー (RFC 9700 / OWASP / 推奨セキュリティ設定)
  app.use((_req, res, next) => {
    // 繧ｯ繝ｪ繝・け繧ｸ繝｣繝・く繝ｳ繧ｰ髦ｲ豁｢
    res.setHeader("X-Frame-Options", "DENY");
    // CSP蜴ｳ譬ｼ蛹・ script-src/style-src/connect-src 縺ｧ XSS 繧呈ｹ譛ｬ繝悶Ο繝・け
    // 'unsafe-inline' 縺ｯ style-src 縺ｮ縺ｿ險ｱ蜿ｯ・・eact/Expo 縺ｮ繧､繝ｳ繝ｩ繧､繝ｳ繧ｹ繧ｿ繧､繝ｫ逕ｨ・・    // API 繧ｵ繝ｼ繝舌・縺ｪ縺ｮ縺ｧ script 螳溯｡後・ 'self' 縺ｮ縺ｿ險ｱ蜿ｯ
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://pbs.twimg.com https://abs.twimg.com data:",
      "connect-src 'self' https://api.twitter.com https://api.x.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    res.setHeader("Content-Security-Policy", cspDirectives);
    // MIME繧ｹ繝九ャ繝輔ぅ繝ｳ繧ｰ髦ｲ豁｢
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Referer ポリシー (Auth BCP 推奨: no-referrer)
    res.setHeader("Referrer-Policy", "no-referrer");
    // HTTPS 強制（本番環境のみ）
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    // XSS フィルター（レガシーブラウザ用）
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Permissions-Policy: 不要な機能を制限
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Rate Limiter Middleware・井ｸ肴ｭ｣繧｢繧ｯ繧ｻ繧ｹ繧定・蜍輔ヶ繝ｭ繝・け・・  app.use(rateLimiterMiddleware);

  registerOAuthRoutes(app);
  registerTwitterRoutes(app);

  // ... (existing imports)

  // ...

  app.get("/api/health", async (_req, res) => {
    try {
      const buildInfo = readBuildInfo();
      const nodeEnv = process.env.NODE_ENV || "development";

      // Use imported APP_VERSION as the authoritative version
      // Fallback to buildInfo.version or "unknown" only if needed, 
      // but ideally we want the semantic version from shared/version.ts
      const displayVersion = APP_VERSION || buildInfo.version || "unknown";

      if (!buildInfo.ok && Sentry) {
        Sentry.captureException(new Error("unknown version in /api/health"), {
          extra: { commitSha: buildInfo.commitSha, env: nodeEnv },
        });
        console.error("[CRITICAL] unknown version detected:", buildInfo);
      }
      const baseInfo = {
        ...buildInfo,
        version: displayVersion, // Override/Ensure version is set
        nodeEnv,
        timestamp: Date.now(),
      };

      let dbStatus: { connected: boolean; latency: number; error: string; challengesCount?: number } = { connected: false, latency: 0, error: "" };
      const DB_CHECK_RETRIES = 2; // 初回のみ DB チェックリトライ（cold start 対策）
      try {
        const { getDb, sql } = await import("../db");
        const startTime = Date.now();
        const db = await getDb();
        if (db) {
          try {
            let lastErr: Error | null = null;
            for (let attempt = 1; attempt <= DB_CHECK_RETRIES; attempt++) {
              try {
                const queryPromise = db.execute(sql`SELECT 1`);
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Query timeout after 10 seconds")), 10000)
                );
                await Promise.race([queryPromise, timeoutPromise]);
                lastErr = null;
                break;
              } catch (queryErr) {
                lastErr = queryErr instanceof Error ? queryErr : new Error(String(queryErr));
                if (attempt < DB_CHECK_RETRIES) {
                  console.warn("[health] DB check attempt", attempt, "failed, retrying in 2s:", lastErr.message);
                  await new Promise((r) => setTimeout(r, 2000));
                }
              }
            }
            if (lastErr) throw lastErr;

            let challengesCount = 0;
            try {
              const r = await db.execute(sql`SELECT COUNT(*) AS c FROM challenges WHERE "isPublic" = true`);
              const rows = (r as unknown as { rows?: Array<{ c: string }> })?.rows ?? (Array.isArray(r) ? r : []);
              challengesCount = rows.length ? Number((rows[0] as { c: string })?.c ?? 0) : 0;
            } catch (countErr) {
              console.warn("[health] Failed to count challenges:", countErr);
            }

            dbStatus = {
              connected: true,
              latency: Date.now() - startTime,
              error: "",
              challengesCount,
            };
          } catch (queryErr) {
            // 繧ｯ繧ｨ繝ｪ螳溯｡後お繝ｩ繝ｼ
            const errorMessage = queryErr instanceof Error ? queryErr.message : String(queryErr);
            // DB エラーから機密情報を除去（nparam 等）
            let cleanMessage = errorMessage
              .replace(/\nparam.*$/g, "")
              .replace(/params:.*$/g, "")
              .replace(/Failed query:.*$/g, "")
              .trim();
            
            // セッション切れのエラーか汚いエラーメッセージか
            if (cleanMessage.includes("timeout") || cleanMessage.includes("session")) {
              cleanMessage = "データベースのセッションが切れました";
            } else if (!cleanMessage || cleanMessage.length < 5) {
              // エラー内容が空の場合は汎用メッセージ
              cleanMessage = "データベースへの接続に失敗しました";
            }
            
            console.error("[health] Database query failed:", {
              error: cleanMessage,
              originalError: errorMessage,
              stack: queryErr instanceof Error ? queryErr.stack : undefined,
              timestamp: new Date().toISOString(), // 繧､繝ｳ繧ｷ繝・Φ繝郁ｪｿ譟ｻ逕ｨ
            });
            
            dbStatus = {
              connected: false,
              latency: Date.now() - startTime,
              error: cleanMessage,
            };
          }
        } else {
          // DATABASE_URL が設定されていても DB に接続できない場合
          const hasDatabaseUrl = !!process.env.DATABASE_URL;
          dbStatus.error = hasDatabaseUrl
            ? "繝・・繧ｿ繝吶・繧ｹ謗･邯壹・遒ｺ遶九↓螟ｱ謨励＠縺ｾ縺励◆"
            : "DATABASE_URL縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ";
        }
      } catch (err) {
        // 予期しない DB エラー（接続エラー等）
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[health] Unexpected database error:", {
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
        dbStatus.error = errorMessage || "謗･邯壹お繝ｩ繝ｼ";
      }

      const checkCritical = _req.query.critical === "true";
      let criticalApis: Record<string, { ok: boolean; error?: string }> & { error?: string } = {};

      if (checkCritical && dbStatus.connected) {
        try {
          const caller = appRouter.createCaller(await createContext({ req: _req as any, res: res as any, info: {} as any }));

          try {
            await caller.events.list();
            criticalApis.homeEvents = { ok: true };
          } catch (err) {
            criticalApis.homeEvents = { ok: false, error: err instanceof Error ? err.message : String(err) };
          }

          try {
            await caller.rankings.hosts({ limit: 1 });
            criticalApis.rankings = { ok: true };
          } catch (err) {
            criticalApis.rankings = { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
        } catch (err) {
          criticalApis.error = err instanceof Error ? err.message : String(err);
        }
      }

      const checkSchema = _req.query.schema === "true";
      let schemaCheck: SchemaCheckResult | undefined;

      if (checkSchema) {
        try {
          schemaCheck = await checkSchemaIntegrity();
          if (schemaCheck.status === "mismatch") {
            await notifySchemaIssue(schemaCheck);
          }
        } catch (error) {
          console.error("[health] Schema check failed:", error);
          schemaCheck = {
            status: "error",
            expectedVersion: "unknown",
            missingColumns: [],
            errors: [error instanceof Error ? error.message : String(error)],
            checkedAt: new Date().toISOString(),
          };
        }
      }

      // DB 譛ｪ謗･邯壹・縺ｨ縺阪□縺・500・・ptimeRobot 繧｢繝ｩ繝ｼ繝茨ｼ峨Ｃuild-info 縺ｮ縺ｿ荳榊ｙ縺ｮ縺ｨ縺阪・ 200 + ok:false 縺ｧ繧｢繝ｩ繝ｼ繝域椛豁｢
      const overallOk =
        dbStatus.connected &&
        buildInfo.ok &&
        (!checkCritical || Object.values(criticalApis).every(api => typeof api === "object" && "ok" in api && api.ok));

      const statusCode = dbStatus.connected ? 200 : 500;
      res.status(statusCode).json({
        ...baseInfo,
        // 蠕梧婿莠呈鋤諤ｧ縺ｮ縺溘ａ縲…ommitsha・亥ｰ乗枚蟄暦ｼ峨ｂ蜷ｫ繧√ｋ
        commitsha: baseInfo.commitSha,
        ok: overallOk,
        db: dbStatus,
        ...(checkCritical && { critical: criticalApis }),
        ...(schemaCheck && { schema: schemaCheck }),
      });
    } catch (err) {
      console.error("[health] Unhandled error:", err);
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        ok: false,
        commitSha: "unknown",
        commitsha: "unknown", // 蠕梧婿莠呈鋤諤ｧ縺ｮ縺溘ａ
        version: "unknown",
        builtAt: "unknown",
        timestamp: Date.now(),
        error: message,
        db: { connected: false, latency: 0, error: message },
      });
    }
  });

  // デバッグ用: 環境変数の確認
  app.get("/api/debug/env", (_req, res) => {
    // 讖溷ｯ・ュ蝣ｱ繧偵・繧ｹ繧ｯ
    const maskSecret = (value: string | undefined) => {
      if (!value) return undefined;
      if (value.length <= 8) return "***";
      return value.substring(0, 4) + "***" + value.substring(value.length - 4);
    };
    
    res.json({
      RAILWAY_GIT_COMMIT_SHA: process.env.RAILWAY_GIT_COMMIT_SHA,
      APP_VERSION: process.env.APP_VERSION,
      GIT_SHA: process.env.GIT_SHA,
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
      // 讖溷ｯ・ュ蝣ｱ縺ｯ繝槭せ繧ｯ
      DATABASE_URL: maskSecret(process.env.DATABASE_URL),
      JWT_SECRET: maskSecret(process.env.JWT_SECRET),
    });
  });

  // API 使用量トラッキング / OpenAPI 仕様取得
  app.get("/api/openapi.json", (_req, res) => {
    res.json(getOpenApiSpec());
  });

  // Swagger UI
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(getOpenApiSpec(), {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "どいんチャレンジ API ドキュメント",
  }));

  // 繧ｷ繧ｹ繝・Β迥ｶ諷狗｢ｺ隱喉PI
  app.get("/api/admin/system-status", async (_req, res) => {
    try {
      const { getDb } = await import("../db");

      // DB 接続チェック
      let dbStatus = { connected: false, latency: 0, error: "" };
      try {
        const startTime = Date.now();
        const db = await getDb();
        if (db) {
          // シンプルに DB 接続チェック
          await db.execute("SELECT 1");
          dbStatus = {
            connected: true,
            latency: Date.now() - startTime,
            error: "",
          };
        } else {
          dbStatus.error = "DATABASE_URL縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ";
        }
      } catch (err) {
        dbStatus.error = err instanceof Error ? err.message : "謗･邯壹お繝ｩ繝ｼ";
      }

      // Twitter API 設定チェック
      const twitterStatus = {
        configured: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
        rateLimitRemaining: undefined as number | undefined,
        error: "",
      };
      if (!twitterStatus.configured) {
        twitterStatus.error = "Twitter API隱崎ｨｼ諠・ｱ縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ";
      }

      // 繧ｵ繝ｼ繝舌・諠・ｱ
      const memUsage = process.memoryUsage();
      const serverInfo = {
        uptime: process.uptime(),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
        },
        nodeVersion: process.version,
      };

      // 環境変数一覧（機密はマスク）
      const envVars = [
        { name: "DATABASE_URL", value: process.env.DATABASE_URL },
        { name: "TWITTER_CLIENT_ID", value: process.env.TWITTER_CLIENT_ID },
        { name: "TWITTER_CLIENT_SECRET", value: process.env.TWITTER_CLIENT_SECRET },
        { name: "TWITTER_BEARER_TOKEN", value: process.env.TWITTER_BEARER_TOKEN },
        { name: "SESSION_SECRET", value: process.env.SESSION_SECRET },
        { name: "EXPO_PUBLIC_API_BASE_URL", value: process.env.EXPO_PUBLIC_API_BASE_URL },
      ];

      const environment = envVars.map((env) => ({
        name: env.name,
        masked: env.value ? env.value.substring(0, 4) + "****" : "未設定",
        configured: !!env.value,
      }));

      res.json({
        database: dbStatus,
        twitter: twitterStatus,
        server: serverInfo,
        environment,
      });
    } catch (err) {
      console.error("[Admin] System status error:", err);
      res.status(500).json({ error: "繧ｷ繧ｹ繝・Β迥ｶ諷九・蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆" });
    }
  });

  app.get("/api/admin/api-usage", async (_req, res) => {
    // TODO: 邂｡逅・・ｪ崎ｨｼ繧定ｿｽ蜉
    try {
      const summary = await getDashboardSummary();
      res.json(summary);
    } catch (error) {
      console.error("[Admin] API usage error:", error);
      res.status(500).json({ error: "API菴ｿ逕ｨ驥上・蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆" });
    }
  });

  app.get("/api/admin/api-usage/stats", (_req, res) => {
    // TODO: 邂｡逅・・ｪ崎ｨｼ繧定ｿｽ蜉
    const stats = getApiUsageStats();
    res.json(stats);
  });

  // 繧ｨ繝ｩ繝ｼ繝ｭ繧ｰAPI
  app.get("/api/admin/errors", (req, res) => {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const resolved = req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : undefined;

    const logs = getErrorLogs({
      category: category as any,
      limit,
      resolved,
    });
    const stats = getErrorStats();

    res.json({ logs, stats });
  });

  // 繧ｨ繝ｩ繝ｼ繧定ｧ｣豎ｺ貂医∩縺ｫ繝槭・繧ｯ
  app.post("/api/admin/errors/:id/resolve", (req, res) => {
    const success = resolveError(req.params.id);
    res.json({ success });
  });

  // 縺吶∋縺ｦ縺ｮ繧ｨ繝ｩ繝ｼ繧定ｧ｣豎ｺ貂医∩縺ｫ繝槭・繧ｯ
  app.post("/api/admin/errors/resolve-all", (_req, res) => {
    const count = resolveAllErrors();
    res.json({ success: true, count });
  });

  // 繧ｨ繝ｩ繝ｼ繝ｭ繧ｰ繧偵け繝ｪ繧｢
  app.delete("/api/admin/errors", (_req, res) => {
    const count = clearErrorLogs();
    res.json({ success: true, count });
  });

  // 邂｡逅・・ヱ繧ｹ繝ｯ繝ｼ繝芽ｪ崎ｨｼ
  app.post("/api/admin/verify-password", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({ error: "パスワードが空です" });
        return;
      }

      if (verifyAdminPassword(password)) {
        // パスワードが正しい場合、管理セッション Cookie を設定して以降のリクエストを許可
        const ADMIN_SESSION_COOKIE = "admin_session";
        const cookieOptions = getSessionCookieOptions(req);

        res.cookie(ADMIN_SESSION_COOKIE, "authenticated", {
          ...cookieOptions,
          maxAge: SESSION_MAX_AGE_MS,
        });

        res.json({ success: true });
      } else {
        res.status(401).json({ error: "パスワードが正しくありません" });
      }
    } catch (error) {
      console.error("[Admin] Password verification error:", error);
      res.status(500).json({ error: "設定に失敗しました" });
    }
  });

  // Clerk ユーザー同期エンドポイント
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token" });
      }
      const token = authHeader.slice(7).trim();
      const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
      if (!clerkSecretKey) return res.status(500).json({ error: "Clerk not configured" });

      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });
      const clerkUserId = payload?.sub;
      if (!clerkUserId) {
        return res.status(401).json({ error: "Invalid token: missing sub claim" });
      }
      const openId = `clerk:${clerkUserId}`;

      const clerk = createClerkClient({ secretKey: clerkSecretKey });
      let user = await import("../db").then((db) => db.getUserByOpenId(openId));
      if (!user) {
        const clerkUser = await clerk.users.getUser(clerkUserId);
        const twitterAccount = clerkUser.externalAccounts?.find(
          (a: { provider: string }) => a.provider === "x" || a.provider === "oauth_x",
        );
        const db = await import("../db");
        await db.upsertUser({
          openId,
          name:
            clerkUser.fullName ||
            (twitterAccount as { username?: string } | undefined)?.username ||
            "Unknown",
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          loginMethod: "twitter",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(openId);
      }

      return res.json({ ok: true, user });
    } catch (err) {
      console.error("[/api/auth/sync] Error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Sentry error handler must be after all controllers and before other error middleware
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // WebSocket繧ｵ繝ｼ繝舌・繧貞・譛溷喧
  initWebSocketServer(server);

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);


