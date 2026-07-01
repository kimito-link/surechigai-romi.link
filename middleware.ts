/**
 * OGP クローラーだけ /u/<slug> を api/u/<slug> に内部 fetch する。
 * 人間のブラウザは Expo SPA（index.html）で /u/<slug> 地図画面を表示。
 *
 * 旧 Response.rewrite キャストは Edge で MIDDLEWARE_INVOCATION_FAILED になるため fetch で代用。
 */

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegram|embedly|pinterest|vkshare|line-poker/i;

export const config = {
  matcher: ["/u/:slug"],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/u\/([A-Za-z0-9]{1,16})$/);
  if (!match) return;

  url.pathname = `/api/u/${match[1]}`;
  return fetch(url.toString(), {
    headers: request.headers,
    method: request.method,
  });
}
