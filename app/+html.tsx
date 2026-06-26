import { ScrollViewStyleReset } from "expo-router/html";
import { palette, color } from "@/theme/tokens";
import type { PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  const enableSpeedInsights = process.env.NODE_ENV === "production";

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
        {/* Theme color for browser chrome（kimito ヘッダーの薄青に合わせる） */}
        <meta name="theme-color" content="#E2EDF7" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --color-background: #F0F4F8;
            --color-surface: #FFFFFF;
            --color-foreground: #0F172A;
            --color-primary: #00427B;
            --color-muted: #64748B;
            --color-border: #E2E8F0;
            color-scheme: light;
          }
          html { background-color: var(--color-background); color-scheme: light; }
          body { background-color: var(--color-background); }
          #root { background-color: var(--color-background); }
        `}} />
      </head>
      <body>
        {children}
        {enableSpeedInsights && (
          <>
            {/* Vercel Speed Insights: script タグで追加（Metro が @vercel/speed-insights を解決できないため） */}
            <script
              dangerouslySetInnerHTML={{
                __html: "window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };",
              }}
            />
            <script defer src="/_vercel/speed-insights/script.js" />
          </>
        )}
      </body>
    </html>
  );
}
