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
// ★★2026-10-02 実機で踏んだ続きのその先（訂正含む）: frontendApiProxy: { enabled: true }
//   を試したが誤りだった。この機能は「Clerkのカスタムドメインを使わず、Clerkの
//   デフォルトフロントエンドAPI(frontend-api.clerk.dev)への直接アクセスがブロックされる
//   環境向け」の別機能——有効にすると常にfrontend-api.clerk.devへ転送し、
//   publishableKeyが指すカスタムドメイン(clerk.kimito.link)は使われない
//   （実機で「Invalid host」が解消せず、window.Clerk.frontendApiは正しいのに
//   window.Clerk.proxyUrlが勝手にセットされていることで発覚）。削除して解消した。
//
//   ★根本原因はClerk JS自身の自動判定: 本番URLが`*.vercel.app`で終わるとき
//   （VERCEL_PROJECT_PRODUCTION_URLで判定。surechigai-webにカスタムドメインを
//   割り当てていないため常にこれに該当する）、Clerk JSはサーバー側の設定に
//   関わらず自動でプロキシモード(/__clerk/経由)に入り、window.Clerk.proxyUrlが
//   勝手にセットされ、プロキシ先(frontend-api.clerk.dev)が「Invalid host」を返す。
//   カスタムドメイン経由でアクセスしても、リクエストを処理する関数自体が
//   surechigai-webプロジェクトである限りこの自動判定は解除されない
//   （ブラウザ上のオリジンではなくVercelプロジェクト自体の本番URLを見ているため）。
//
//   ★2026-10-02 解決: frontendApiProxy.enabled はboolean/function指定が可能。
//   明示的に false を渡して自動判定を上書きする——これにより常にpublishableKeyが
//   指すカスタムドメイン(clerk.kimito.link)を直接使うようになる。
//   「別Vercelプロジェクトへの外部rewriteプロキシ」構成（strangler移行等）で
//   カスタムドメインを移管できない場合は、このfalse明示が正しい対処。
// ============================================================================
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: false,
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
