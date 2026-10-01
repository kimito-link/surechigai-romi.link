import type { NextConfig } from "next";

/**
 * surechigai Web（Next.js 版）。
 * ★基準は kimito.link（kimitolink-linktree/next.config.ts）。金型 templates/next-app を
 *   土台にしつつ、Next 16 系の実運用値へ合わせている（金型は Next 15 のままなので
 *   Phase 1.5 で還流する）。
 */
const nextConfig: NextConfig = {
  // 既存 Expo Web と同じく末尾スラッシュ付きに揃える（既存URLを壊さない）。
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // ★strangler 移行中は旧系統と同居するため、ビルド対象を apps/web に閉じる。
  outputFileTracingRoot: __dirname,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com", pathname: "/**" },
      { protocol: "https", hostname: "abs.twimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      { protocol: "https", hostname: "images.clerk.dev", pathname: "/**" },
    ],
  },
  async headers() {
    // 認証ページはキャッシュさせない（セッション取り違え防止）。
    const noStoreHeaders = [
      { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];
    return [
      { source: "/sign-in/:path*", headers: noStoreHeaders },
      { source: "/sign-up/:path*", headers: noStoreHeaders },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ★★CSP はここで持たせる必要がある（Step 2 の宿題）。
          //   旧プロジェクトの CSP は ../../vercel.json の headers "/(.*)" にあるが、
          //   strangler の rewrite で /sign-in を**新プロジェクトが応答する**ようになると、
          //   旧 vercel.json の header は当たらない（応答するオリジンが変わるため）。
          //   ＝ 移行したパスだけ CSP が消え、セキュリティ点数が下がる。
          //   Step 2 で ../../vercel.json:14 の Content-Security-Policy を写し、
          //   clerk.kimito.link / x.com など既存の許可先を欠かさないこと。
          //   ★本番は現在 script-src に unsafe-inline/unsafe-eval を含み減点されている
          //     （verify-security-score の既存の赤）。写すときに改善を検討してよいが、
          //     Clerk が動かなくなるので外すなら実機確認が要る。
        ],
      },
    ];
  },
};

export default nextConfig;
