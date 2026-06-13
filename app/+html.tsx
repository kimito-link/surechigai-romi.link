import { ScrollViewStyleReset } from "expo-router/html";
import { palette } from "@/theme/tokens";
import type { PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* Preconnect: API・Clerkの接続を事前開始 */}
        <link rel="preconnect" href="https://surechigai-romi.link" />
        <link rel="dns-prefetch" href="https://surechigai-romi.link" />
        <link rel="preconnect" href="https://clerk.accounts.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://clerk.accounts.dev" />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Theme color for browser chrome */}
        <meta name="theme-color" content={palette.gray900} />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>
        {children}
        {/* Vercel Speed Insights: script タグで追加（Metro が @vercel/speed-insights を解決できないため） */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };",
          }}
        />
        <script defer src="/_vercel/speed-insights/script.js" />
      </body>
    </html>
  );
}
