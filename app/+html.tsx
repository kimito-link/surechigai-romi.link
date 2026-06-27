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
        {/* 既定のタイトル・説明（改ざん検知対策: 正規の内容を明示。各画面で上書き可） */}
        <title>君斗りんくのすれ違ひ通信｜会いたい君がいる現在地</title>
        <meta
          name="description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。会いたい君がいる現在地で、移動の足あとを残して後でその場所をたどれる。"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://surechigai-romi.link/" />
        {/* OGP / Twitter Card */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="君斗りんくのすれ違ひ通信" />
        <meta property="og:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          property="og:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。会いたい君がいる現在地で、移動の足あとを残して後でその場所をたどれる。"
        />
        <meta property="og:url" content="https://surechigai-romi.link/" />
        <meta property="og:image" content="https://surechigai-romi.link/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          name="twitter:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。"
        />
        <meta name="twitter:image" content="https://surechigai-romi.link/api/og" />
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
