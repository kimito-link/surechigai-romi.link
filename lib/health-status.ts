import { DEFAULT_POST_AUTH_PATH } from "./clerk-route.js";

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isHomeRedirect(value: string | undefined): boolean {
  const normalized = value?.trim().replace(/\/+$/, "") ?? "";
  return normalized === "" || normalized === DEFAULT_POST_AUTH_PATH.replace(/\/+$/, "");
}

export type DbLatencyCheck = {
  status: "ok" | "error" | "skipped";
  latencyMs: number | null;
  error?: string;
};

/**
 * DB round-trip 単体のレイテンシ計測（SELECT 1 実行時間）。
 * Vercel⇄Railway間の往復レイテンシがボトルネックかどうかの一次判断材料として、
 * api/health.ts から都度計測する（buildHealthStatus とは独立・DB接続を必要とするため
 * ここだけ非同期・実クエリを投げる）。
 * DB未接続（DATABASE_URL未設定）の場合は status:"skipped" を返す。
 */
export async function measureDbLatency(): Promise<DbLatencyCheck> {
  try {
    const { getDb, sql } = await import("../server/db/connection.js");
    const db = await getDb();
    if (!db) {
      return { status: "skipped", latencyMs: null };
    }
    const startedAt = Date.now();
    await db.execute(sql`SELECT 1`);
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: "error",
      latencyMs: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** kimito buildHealthStatus を surechigai 向けに移植。 */
export function buildHealthStatus(env: Record<string, string | undefined> = process.env) {
  const clerkPublishable = hasValue(env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const clerkSecret = hasValue(env.CLERK_SECRET_KEY);
  const clerkKeysConfigured = clerkPublishable && clerkSecret;

  const forceRedirectEnvKeys = [
    "EXPO_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL",
    "EXPO_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL",
  ] as const;
  const forceRedirectsConfigured =
    forceRedirectEnvKeys.every((key) => isHomeRedirect(env[key])) ||
    (!hasValue(env[forceRedirectEnvKeys[0]]) && !hasValue(env[forceRedirectEnvKeys[1]]));
  const forceRedirectsSource = forceRedirectEnvKeys.some((key) => hasValue(env[key]))
    ? "env"
    : "code-default";

  const databaseConfigured = hasValue(env.DATABASE_URL);
  const authHealthy = clerkKeysConfigured && forceRedirectsConfigured;
  const isProduction = (env.VERCEL_ENV ?? env.NODE_ENV) === "production";
  const ok = !isProduction || (authHealthy && databaseConfigured);

  return {
    ok,
    status: ok ? "ok" : "misconfigured",
    service: "surechigai-romi-api",
    checkedAt: new Date().toISOString(),
    deployment: {
      environment: env.VERCEL_ENV ?? env.NODE_ENV ?? "unknown",
      commit: env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      region: env.VERCEL_REGION ?? null,
    },
    checks: {
      authentication: {
        status: authHealthy ? "ok" : "misconfigured",
        clerkKeysConfigured,
        forceRedirectsConfigured,
        forceRedirectsSource,
        expectedPostAuthPath: DEFAULT_POST_AUTH_PATH,
      },
      database: {
        status: databaseConfigured ? "ok" : "misconfigured",
        configured: databaseConfigured,
      },
    },
  };
}
