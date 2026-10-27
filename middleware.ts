/**
 * OGP クローラーだけ /u/<slug> と /s/<id> をメタHTMLへ内部 fetch する。
 * /u の人間はそのまま Expo SPA。/s の人間はアプリトップへ戻す。
 *
 * 旧 Response.rewrite キャストは Edge で MIDDLEWARE_INVOCATION_FAILED になるため fetch で代用。
 */

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegram|embedly|pinterest|vkshare|line-poker|meta-externalagent|redditbot|skypeuripreview/i;

export const config = {
  // ★Edge ランタイムは非推奨（Vercel のビルド警告）。Node.js ランタイムを明示する。
  //   OGP クローラー向けの内部 fetch だけの処理で、Edge 固有の機能は使っていない。
  runtime: "nodejs",
  matcher: ["/u/:slug", "/s/:id"],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") ?? "";
  const isBot = BOT_UA.test(ua);

  const shareCard = url.pathname.match(/^\/s\/([A-Za-z0-9]{1,16})$/);
  if (shareCard) {
    if (!isBot) {
      // Response.redirect のヘッダは immutable なので、自前で組む。
      // ボット向けHTMLを人間に配らない。リダイレクト自体はキャッシュしない。
      return new Response(null, {
        status: 302,
        headers: {
          Location: new URL("/", url).toString(),
          "Cache-Control": "private, no-store",
          Vary: "User-Agent",
        },
      });
    }
    url.pathname = `/api/s/${shareCard[1]}`;
    return fetch(url.toString(), {
      headers: request.headers,
      method: request.method,
    });
  }

  if (!isBot) return;

  const userPage = url.pathname.match(/^\/u\/([A-Za-z0-9]{1,16})$/);
  if (!userPage) return;

  url.pathname = `/api/u/${userPage[1]}`;
  return fetch(url.toString(), {
    headers: request.headers,
    method: request.method,
  });
}
