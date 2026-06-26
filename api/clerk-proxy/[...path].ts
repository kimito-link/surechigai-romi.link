// Clerk Frontend API プロキシ（方式A サテライト用）
//
// surechigai-romi.link は kimito の Clerk 本番インスタンス(clerk.kimito.link)を
// サテライトとして共有する。本番キー(pk_live_)はドメインロックされているため、
// surechigai-romi.link から直接 Clerk FAPI を叩くと 400 になる。
// そこで /__clerk/* を Clerk FAPI(https://frontend-api.clerk.services/*) へ転送し、
// 必須3ヘッダー(Clerk-Proxy-Url / Clerk-Secret-Key / X-Forwarded-For)を付与する。
//
// Clerk Dashboard 側の satellite ドメインは proxy_url=https://surechigai-romi.link/__clerk
// で登録済み。CNAME(DNS)設定は不要。
//
// ルーティング: vercel.json の rewrite で /__clerk/:path* -> /api/clerk-proxy/:path*

export const config = { runtime: "edge" };

const CLERK_FAPI = "https://frontend-api.clerk.services";
const PROXY_URL = "https://surechigai-romi.link/__clerk";

function resolveClerkPath(pathname: string): string {
  // rewrite 後は /api/clerk-proxy/<clerk path>、直アクセス時は /__clerk/<clerk path>。
  // どちらの prefix も剥がして Clerk FAPI 側のパスへ正規化する。
  return pathname
    .replace(/^\/api\/clerk-proxy/, "")
    .replace(/^\/__clerk/, "");
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const clerkPath = resolveClerkPath(url.pathname) || "/";
  const target = `${CLERK_FAPI}${clerkPath}${url.search}`;

  const headers = new Headers(req.headers);
  // 必須3ヘッダー（Clerk のプロキシ要件）
  headers.set("Clerk-Proxy-Url", PROXY_URL);
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY ?? "");
  headers.set(
    "X-Forwarded-For",
    req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "",
  );
  // upstream に転送すべきでない/二重処理を招くヘッダーを除去
  headers.delete("host");
  headers.delete("accept-encoding");
  headers.delete("content-length");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (hasBody) {
    init.body = req.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init);

  const responseHeaders = new Headers(upstream.headers);
  // ストリーム消費時に undici が解凍するため、整合性のため除去
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
