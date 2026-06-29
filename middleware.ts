/**
 * OGP クローラーだけ /u/<slug> を api/u/<slug> に rewrite する。
 * 人間のブラウザは Expo SPA（index.html）で /u/<slug> 地図画面を表示。
 */

/** Vercel Edge Middleware の Response.rewrite（型定義に無い） */
type VercelResponse = typeof Response & {
  rewrite: (url: URL | string) => Response;
};

const VercelResponse = Response as VercelResponse;

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegram|embedly|pinterest|vkshare|line-poker/i;

export const config = {
  matcher: ["/u/:slug"],
};

export default function middleware(request: Request): Response | undefined {
  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/u\/([A-Za-z0-9]{1,16})$/);
  if (!match) return;

  url.pathname = `/api/u/${match[1]}`;
  return VercelResponse.rewrite(url);
}
