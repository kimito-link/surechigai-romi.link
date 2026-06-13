/**
 * CORS許可オリジンの判定
 *
 * @internal テスト用にexport（本来はprivate関数）
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  // 許可するオリジンのリスト（環境変数でカンマ区切り指定）
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 開発環境では localhost を許可
  if (process.env.NODE_ENV !== "production") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  // 本番環境では ALLOWED_ORIGINS を優先
  if (ALLOWED_ORIGINS.length > 0) {
    return ALLOWED_ORIGINS.some((allowed) => {
      if (origin === allowed) return true;

      if (allowed.startsWith(".") && allowed.length > 1) {
        try {
          const url = new URL(origin);
          return url.hostname === allowed.slice(1) || url.hostname.endsWith(allowed);
        } catch {
          return origin.endsWith(allowed) || origin === allowed.slice(1);
        }
      }

      try {
        const originUrl = new URL(origin);
        const allowedUrl = allowed.startsWith("http") ? new URL(allowed) : null;
        if (allowedUrl) {
          return originUrl.origin === allowedUrl.origin;
        } else {
          return originUrl.hostname === allowed || originUrl.hostname.endsWith(`.${allowed}`);
        }
      } catch {
        return origin === allowed || origin.endsWith(allowed);
      }
    });
  }

  // ALLOWED_ORIGINS が未設定の場合、doin-challenge.com のサブドメインを許可
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    return hostname === "doin-challenge.com" || hostname.endsWith(".doin-challenge.com");
  } catch {
    // URLパース失敗時は安全側に倒して拒否
    return false;
  }
}
