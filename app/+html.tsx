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
        {/* PWA / favicon — kimito-link 公式ゆっくりりんく + すれ違い（pnpm brand:icons） */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#00427B" />
        <meta name="apple-mobile-web-app-title" content="すれ違ひ通信" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t="君斗りんくのすれ違ひ通信";function fix(){if(!document.title||document.title.length<4)document.title=t}fix();document.addEventListener("DOMContentLoaded",fix);setTimeout(fix,0);setTimeout(fix,500);var mo=new MutationObserver(fix);var el=document.querySelector("title");if(el)mo.observe(el,{childList:true,characterData:true,subtree:true})})();`,
          }}
        />
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
