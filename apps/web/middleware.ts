// ============================================================================
// Clerk 認証の middleware。
// ★出典: web-ios-android/templates/next-app/middleware.ts.template（金型）
//   ＝ kimitolink-linktree の実運用版。輸入実績2件目。
//
// ★★なぜ必須か（2026-10-01 に実機で踏んだ）:
//   middleware が無いと Clerk が自前のプロキシ経路
//   `/__clerk/npm/@clerk/clerk-js@6/dist/clerk.browser.js` から JS を読もうとし、
//   そのパスを誰も配信していないので **404 → MIME エラーで Clerk が起動しない**。
//   ブラウザのコンソールには
//     Refused to execute script ... MIME type ('text/html') is not executable
//   が出る。★「鍵が違う」「ドメインが未登録」と誤診しやすいので注意。
//   clerkMiddleware を置くと clerk.kimito.link から直接読む形になり解消する
//   （本番 surechigai.kimito.link / kimito.link はどちらも直接読み＝対照で確認済み）。
//
// ★★2026-10-02 実機で踏んだ続き: 上記コメントの「clerkMiddleware を置けば解消する」
//   は不正確だった。`surechigai-web.vercel.app` 単体へアクセスすると同じ404が再現した。
//   真因は matcher の除外パターン `js(?!on)` ——`/__clerk/npm/.../clerk.browser.js` も
//   拡張子 `.js` を持つため、**matcher の除外対象に該当し middleware が実行されていなかった**。
//   Clerk公式ドキュメント（clerk.com/docs/reference/nextjs/clerk-middleware）が明記する通り、
//   `/__clerk/(.*)` を matcher に明示的に含める必要がある（静的アセット除外より優先させる）。
//
// ★strangler 移行中の方針（金型からの意図的な差分）:
//   金型は「公開ルート以外は auth.protect()」だが、この段階では
//   **このアプリは /sign-in しか配信していない**（他のパスは旧 Expo 側が応答する）。
//   ここで全部を保護対象にすると、移行していないパスの扱いを二重に持つことになる。
//   よって当面は **protect せず、Clerk を初期化するだけ** にする。
//   ルートを移してくるたびに、その都度 isProtectedRoute へ足していく。
//
// ★★2026-10-02 実機で踏んだ続きのその先: matcher に /__clerk/(.*) を足しても
//   「Invalid host」400が解消しなかった。真因は clerkMiddleware() を**オプションなし**
//   で呼んでいたこと——matcher で /__clerk/ がmiddlewareを通るようにはなったが、
//   実際にヘッダー(Clerk-Proxy-Url 等)を付けてclerk.kimito.linkへ転送する処理
//   (frontendApiProxy)自体が有効化されていなかった。Clerk公式ドキュメント
//   （clerk.com/docs/guides/dashboard/dns-domains/proxy-fapi）が明記する通り、
//   frontendApiProxy: { enabled: true } を明示する必要がある。
// ============================================================================
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: true,
  },
});

export const config = {
  matcher: [
    // ★Clerk のフロントエンドAPIプロキシ経路。静的アセット除外より先に置き、
    //   拡張子 .js を理由に除外されないようにする（2026-10-02 実損対応）。
    "/__clerk/(.*)",
    // 静的アセット・_next を除く全ルート。
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
