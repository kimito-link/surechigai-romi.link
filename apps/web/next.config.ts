import type { NextConfig } from "next";

/**
 * surechigai Web（Next.js 版）。
 * ★基準は kimito.link（kimitolink-linktree/next.config.ts）。金型 templates/next-app を
 *   土台にしつつ、Next 16 系の実運用値へ合わせている（金型は Next 15 のままなので
 *   Phase 1.5 で還流する）。
 */
/**
 * ★Content-Security-Policy（2026-10-01・Step 2 で移送）
 *
 * 旧プロジェクトの `../../vercel.json` の headers "/(.*)" が正本だったが、
 * strangler の rewrite で移行したパスを**新プロジェクトが応答する**ようになると
 * 旧 vercel.json の header は当たらない（応答するオリジンが変わるため）。
 * ＝ 移行したパスだけ CSP が消える。そこで同じ内容をここへ写した。
 *
 * ★許可先は旧設定から1つも減らしていない（Clerk・X API・地図タイル・Sentry 等）。
 *   減らすと本番で沈黙して壊れるため、整理するなら実機確認とセットで行う。
 *
 * ★既知の減点: script-src の 'unsafe-inline' / 'unsafe-eval'。
 *   `verify-security-score` が -5点として既に赤を出している（本番も同じ）。
 *   ここでは**旧と同じ挙動を保つことを優先**して踏襲した。
 *   外すと Clerk が動かなくなる可能性が高いので、改善は別途 nonce 化等を
 *   実機確認付きで行う（この移送では挙動を変えない）。
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.kimito.link https://challenges.cloudflare.com https://va.vercel-scripts.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.twimg.com https://*.clerk.com https://unavatar.io https://kimito.link https://*.openfreemap.org https://tile.openstreetmap.org",
  "connect-src 'self' https://clerk.kimito.link https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.x.com https://api.twitter.com https://*.openfreemap.org https://tile.openstreetmap.org https://*.vercel-insights.com https://cloudflareinsights.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.kimito.link",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob:",
  "manifest-src 'self'",
  "form-action 'self' https://clerk.kimito.link https://kimito.link",
].join("; ");

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
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
