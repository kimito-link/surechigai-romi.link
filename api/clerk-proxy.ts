// Clerk Frontend API プロキシ（方式A サテライト用・フラット関数）
//
// surechigai-romi.link は kimito の Clerk 本番インスタンス(clerk.kimito.link)を
// サテライトとして共有する。本番キー(pk_live_)はドメインロックされているため、
// satellite ドメインから直接 Clerk FAPI を叩くと /v1/environment が 400 になる。
// そこで /__clerk/* を Clerk FAPI(https://frontend-api.clerk.services/*) へ転送し、
// 必須3ヘッダー(Clerk-Proxy-Url / Clerk-Secret-Key / X-Forwarded-For)を付与する。
//
// ルーティング: Vercel の catch-all [...path] はこの構成では複数セグメントに
// マッチしないため、公式の「クエリでパスを渡す」rewrite パターンを使う。
//   vercel.json: /__clerk/:path* -> /api/clerk-proxy?__clerkPath=:path*
//
// Clerk Dashboard 側は proxy_url=https://surechigai-romi.link/__clerk で登録済み(DNS不要)。

export const config = { runtime: "edge" };

const CLERK_FAPI = "https://frontend-api.clerk.services";
const PROXY_URL = "https://surechigai-romi.link/__clerk";

// Edge の fetch に受信ヘッダーを丸ごと渡すと不正ヘッダーで落ちるため、
// upstream へ転送するヘッダーは必要なものだけに絞る。
const FORWARD_HEADERS = [
  "cookie",
  "authorization",
  "content-type",
  "accept",
  "accept-language",
  "user-agent",
  "origin",
  "referer",
];

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    const clerkPath = (url.searchParams.get("__clerkPath") ?? "").replace(/^\/+/, "");
    const params = new URLSearchParams(url.search);
    params.delete("__clerkPath");
    const qs = params.toString();
    const target = `${CLERK_FAPI}/${clerkPath}${qs ? `?${qs}` : ""}`;

    const headers = new Headers();
    for (const name of FORWARD_HEADERS) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    // Clerk-* ヘッダー（プロキシ往復で必要になりうる）を引き継ぐ
    req.headers.forEach((value, name) => {
      if (name.toLowerCase().startsWith("clerk-")) headers.set(name, value);
    });
    // 必須3ヘッダー（Clerk のプロキシ要件）
    headers.set("Clerk-Proxy-Url", PROXY_URL);
    headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY ?? "");
    headers.set(
      "X-Forwarded-For",
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
    );

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers,
      redirect: "manual",
    };
    if (hasBody) {
      init.body = await req.arrayBuffer();
    }

    const upstream = await fetch(target, init);

    // opaqueredirect(status 0) など Response 構築不可なステータスを正規化
    const status = upstream.status === 0 ? 502 : upstream.status;
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new Response(upstream.body, {
      status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return new Response(`clerk-proxy error: ${message}`, {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
