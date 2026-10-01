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
// ★strangler 移行中の方針（金型からの意図的な差分）:
//   金型は「公開ルート以外は auth.protect()」だが、この段階では
//   **このアプリは /sign-in しか配信していない**（他のパスは旧 Expo 側が応答する）。
//   ここで全部を保護対象にすると、移行していないパスの扱いを二重に持つことになる。
//   よって当面は **protect せず、Clerk を初期化するだけ** にする。
//   ルートを移してくるたびに、その都度 isProtectedRoute へ足していく。
// ============================================================================
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // 静的アセット・_next を除く全ルート。
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
