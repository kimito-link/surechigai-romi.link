import { ScrollViewStyleReset } from "expo-router/html";
import { PWA_APP_NAME } from "@/components/brand/web-document-head";
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
        <title>{PWA_APP_NAME}</title>
        <meta
          name="description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。会いたい君がいる現在地で、移動の足あとを残して後でその場所をたどれる。"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://surechigai.kimito.link/" />
        {/* OGP / Twitter Card */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="君斗りんくのすれ違ひ通信" />
        <meta property="og:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          property="og:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。会いたい君がいる現在地で、移動の足あとを残して後でその場所をたどれる。"
        />
        <meta property="og:url" content="https://surechigai.kimito.link/" />
        <meta property="og:image" content="https://surechigai.kimito.link/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          name="twitter:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。"
        />
        <meta name="twitter:image" content="https://surechigai.kimito.link/api/og" />
        {/* Preconnect: 自サイトのみ（Clerk は /sign-in 画面だけで preconnect — kimito 準拠） */}
        <link rel="preconnect" href="https://surechigai.kimito.link" />
        <link rel="dns-prefetch" href="https://surechigai.kimito.link" />
        {/* PWA / favicon — ゆっくりりんく（pnpm brand:icons） */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
        <link rel="shortcut icon" href="/favicon-48.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa-icon-180.png" />
        <meta name="theme-color" content="#00427B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="application-name" content={PWA_APP_NAME} />
        <meta name="apple-mobile-web-app-title" content={PWA_APP_NAME} />
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
            --color-muted: #475569;
            --color-border: #E2E8F0;
            color-scheme: light;
          }
          html { background-color: var(--color-background); color-scheme: light; }
          body {
            background-color: var(--color-background);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
            text-rendering: optimizeSpeed;
          }
          #root { background-color: var(--color-background); min-height: 100%; }
        `}} />
      </head>
      <body>
        {children}
        {enableSpeedInsights && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};function load(){var s=document.createElement("script");s.src="/_vercel/speed-insights/script.js";s.defer=true;document.body.appendChild(s)}if(document.readyState==="complete"){load()}else{window.addEventListener("load",load,{once:true})}})();`,
            }}
          />
        )}
      </body>
    </html>
  );
}
