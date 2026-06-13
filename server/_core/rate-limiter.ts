/**
 * Rate Limiter Middleware
 * 
 * アプリケーションレベルのRate limiting実装
 * Cloudflareと二重防御し、不正アクセスを自動的にブロック
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// メモリベースのRate limiter（本番環境ではRedis推奨）
const rateLimitStore = new Map<string, RateLimitEntry>();

// クリーンアップ（1分ごと）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;  // 時間窓（ミリ秒）
  maxRequests: number;  // 最大リクエスト数
}

// デフォルト設定
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1分
  maxRequests: 100,  // 100リクエスト
};

// パスごとの設定
const PATH_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth': {
    windowMs: 60 * 1000,  // 1分
    maxRequests: 5,  // 5リクエスト（ログイン保護）
  },
  '/api/trpc': {
    windowMs: 10 * 1000,  // 10秒
    maxRequests: 10,  // 10リクエスト
  },
};

/**
 * Rate limitをチェック
 */
export function checkRateLimit(ip: string, path: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  // パスに応じた設定を取得
  let config = DEFAULT_CONFIG;
  for (const [pathPrefix, pathConfig] of Object.entries(PATH_CONFIGS)) {
    if (path.startsWith(pathPrefix)) {
      config = pathConfig;
      break;
    }
  }

  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // エントリが存在しない、または期限切れの場合
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // リクエスト数をインクリメント
  entry.count++;

  // 制限を超えた場合
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * IPアドレスを安全に取得（プロキシ経由を考慮）
 * 
 * @internal テスト用にexport（本来はprivate関数）
 */
export function getClientIp(req: any): string {
  // 1. 信頼できるプロキシからの x-forwarded-for を優先
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for は "client, proxy1, proxy2" の形式
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0].split(',') 
      : forwardedFor.split(',');
    // 最初のIP（クライアントのIP）を取得
    const clientIp = ips[0]?.trim();
    if (clientIp && /^[\d.:]+$/.test(clientIp)) {
      return clientIp;
    }
  }
  
  // 2. 直接接続の場合
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Express/Fastifyミドルウェア
 */
export function rateLimiterMiddleware(req: any, res: any, next: any) {
  const ip = getClientIp(req);
  const path = req.path || req.url;

  const result = checkRateLimit(ip, path);

  // レスポンスヘッダーを設定
  res.setHeader('X-RateLimit-Limit', result.remaining + (result.allowed ? 1 : 0));
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

  if (!result.allowed) {
    // セキュリティログ（機密情報は含めない）
    console.warn(`[RateLimit] Blocked request from ${ip} to ${path}`, {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 100), // 長すぎる場合は切り詰め
    });
    
    return res.status(429).json({
      error: 'Too many requests',
      message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
  }

  next();
}

/**
 * 統計情報を取得（管理画面用）
 */
export function getRateLimitStats() {
  const stats = {
    totalEntries: rateLimitStore.size,
    blockedIPs: [] as string[],
  };

  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime > now) {
      const [ip] = key.split(':');
      if (!stats.blockedIPs.includes(ip)) {
        stats.blockedIPs.push(ip);
      }
    }
  }

  return stats;
}
