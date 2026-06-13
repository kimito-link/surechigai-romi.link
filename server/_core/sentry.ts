import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not configured. Error tracking is disabled.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Set profilesSampleRate to 1.0 to profile every transaction.
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Gate 1: 3種類の通知のみに絞る（ノイズ抑制）
    beforeSend(event, hint) {
      // Filter out development errors
      if (process.env.NODE_ENV === "development") {
        console.log("Sentry event (dev mode):", event);
      }

      const error = hint.originalException;
      const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
      const statusCode = event.contexts?.response?.status_code;

      // 1. ログイン失敗の急増（OAuth callback error）
      const isOAuthError = 
        message.includes("OAuth") || 
        message.includes("callback") || 
        message.includes("state parameter") ||
        event.request?.url?.includes("/api/auth/callback");

      // 2. 5xxの急増
      const is5xxError = 
        statusCode && statusCode >= 500 && statusCode < 600;

      // 3. "unknown version"検知
      const isUnknownVersion = 
        message.includes("unknown version") ||
        event.extra?.version === "unknown";

      // 3種類のいずれかに該当する場合のみ通知
      if (isOAuthError || is5xxError || isUnknownVersion) {
        return event;
      }

      // それ以外は通知しない（ノイズ抑制）
      return null;
    },
  });

  console.log("Sentry initialized for backend");
}

export { Sentry };
