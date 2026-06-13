import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Gate 1: 3種類の通知のみに絞る（ノイズ抑制）
  beforeSend(event, hint) {
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
