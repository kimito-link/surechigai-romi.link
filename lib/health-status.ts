import { DEFAULT_POST_AUTH_PATH } from "./clerk-route.js";

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isHomeRedirect(value: string | undefined): boolean {
  const normalized = value?.trim().replace(/\/+$/, "") ?? "";
  return normalized === "" || normalized === DEFAULT_POST_AUTH_PATH.replace(/\/+$/, "");
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
