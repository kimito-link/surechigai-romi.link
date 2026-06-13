import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

/**
 * Extract parent domain for cookie sharing across subdomains.
 * e.g., "3000-xxx.manuspre.computer" -> ".manuspre.computer"
 * This allows cookies set by 3000-xxx to be read by 8081-xxx
 */
function getParentDomain(hostname: string): string | undefined {
  // Don't set domain for localhost or IP addresses
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
  }

  // Split hostname into parts
  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (e.g., "3000-xxx.manuspre.computer")
  // For "manuspre.computer", we can't set a parent domain
  if (parts.length < 3) {
    return undefined;
  }

  // Return parent domain with leading dot (e.g., ".manuspre.computer")
  // This allows cookie to be shared across all subdomains
  return "." + parts.slice(-2).join(".");
}

/**
 * プロキシ経由のときはクライアントのホストを使う（Vercel → Railway で admin_session を doin-challenge.com に送るため）
 */
function getEffectiveHostname(req: Request): string {
  const forwarded = req.headers["x-forwarded-host"];
  if (forwarded) {
    const host = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    if (host && host.trim()) return host.trim();
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.hostname) return u.hostname;
    } catch {
      // ignore
    }
  }
  return req.hostname;
}

/**
 * プロキシ経由（Vercel→Railway）のときは Domain を付けない。ブラウザがリクエストホストに紐づけて Cookie を保存する。
 * 
 * セキュリティ考慮:
 * - x-forwarded-host ヘッダーは信頼できるプロキシからのみ受け入れるべき
 * - 本番環境では信頼できるプロキシリストを設定することを推奨
 */
function getCookieDomain(req: Request, hostname: string): string | undefined {
  const forwarded = req.headers["x-forwarded-host"] ?? req.headers.origin;
  
  // プロキシ経由の場合、domain 指定しない → doin-challenge.com に保存される
  // 注意: 本番環境では信頼できるプロキシからのみ受け入れるべき
  if (forwarded) {
    // TODO: 本番環境では信頼できるプロキシリストを検証する
    return undefined;
  }
  
  return getParentDomain(hostname);
}

export function getSessionCookieOptions(
  req: Request,
  options?: {
    /**
     * OAuthコールバックなど、クロスサイトリクエストでCookieを送信する必要がある場合にtrue
     * sameSite: "none" を使用し、secure: true が必須になる
     */
    crossSite?: boolean;
  },
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = getEffectiveHostname(req);
  const domain = getCookieDomain(req, hostname);
  const isSecure = isSecureRequest(req);

  // OAuthコールバックなど、クロスサイトリクエストの場合
  // sameSite: "none" を使用（secure: true が必須）
  if (options?.crossSite) {
    // HTTPS環境でのみ動作（sameSite: "none" には secure: true が必須）
    if (!isSecure) {
      console.warn(
        "[Cookies] crossSite=true requires HTTPS. Falling back to sameSite=lax",
      );
      return {
        domain,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
      };
    }

    return {
      domain,
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
    };
  }

  // 通常のセッション管理（sameSite: "lax" で十分）
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  };
}
