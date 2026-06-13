/**
 * Sentry Error Tracking - 遅延読み込み対応
 * 初期バンドルサイズを削減するため、動的インポートを使用
 */

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

let _Sentry: typeof import("@sentry/react") | null = null;

export async function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not configured. Error tracking is disabled.");
    return;
  }

  try {
    const Sentry = await import("@sentry/react");
    _Sentry = Sentry;

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event) {
        if (process.env.NODE_ENV === "development") {
          console.log("Sentry event (dev mode):", event);
        }
        return event;
      },
    });

    // Set app context
    const Constants = (await import("expo-constants")).default;
    const appVersion = Constants.expoConfig?.version || "unknown";
    Sentry.setContext("app", {
      version: appVersion,
      platform: Constants.platform?.os || "unknown",
    });
  } catch (error) {
    console.warn("Failed to initialize Sentry:", error);
  }
}

/** Sentryインスタンスを取得（初期化後のみ使用可能） */
export function getSentry() {
  return _Sentry;
}

// 後方互換性のため、遅延プロキシを提供
export const Sentry = new Proxy({} as typeof import("@sentry/react"), {
  get(_target, prop) {
    if (_Sentry) {
      return (_Sentry as any)[prop];
    }
    // 初期化前はno-op関数を返す
    if (typeof prop === "string") {
      return (..._args: any[]) => {
        console.warn(`Sentry.${prop} called before initialization`);
      };
    }
    return undefined;
  },
});
