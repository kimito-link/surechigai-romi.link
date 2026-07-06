import { ScrollViewStyleReset } from "expo-router/html";
import { PWA_APP_NAME } from "@/components/brand/web-document-head";
import { APP_ORIGIN, MARKETING_URL } from "@/lib/site-urls";
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
        <link rel="canonical" href={`${APP_ORIGIN}/`} />
        <link rel="alternate" href={MARKETING_URL} title="kimito.link 公式紹介" />
        {/* OGP / Twitter Card */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="君斗りんくのすれ違ひ通信" />
        <meta property="og:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          property="og:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。会いたい君がいる現在地で、移動の足あとを残して後でその場所をたどれる。"
        />
        <meta property="og:url" content={`${APP_ORIGIN}/`} />
        <meta property="og:image" content={`${APP_ORIGIN}/api/og`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="君斗りんくのすれ違ひ通信｜会いたい君がいる現在地" />
        <meta
          name="twitter:description"
          content="位置情報で近くにいた人とすれ違える、無料のすれ違い通信アプリ。"
        />
        <meta name="twitter:image" content={`${APP_ORIGIN}/api/og`} />
        {/* Preconnect: 自サイトのみ（Clerk は /sign-in 画面だけで preconnect — kimito 準拠） */}
        <link rel="preconnect" href={APP_ORIGIN} />
        <link rel="dns-prefetch" href={APP_ORIGIN} />
        {/* PWA / favicon — ゆっくりりんく（pnpm brand:icons） */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
        <link rel="shortcut icon" href="/favicon-48.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa-icon-180.png" />
        {/* iOS Safari PWA（ホーム画面追加後）の起動スプラッシュ。
            manifest.json だけでは iOS はロゴ入りスプラッシュを生成しないため、
            デバイス解像度ごとに個別画像+media queryが必要（pnpm brand:icons で生成）。 */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait), (device-width: 390px) and (device-height: 844px) and (resolution: 3dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait), (device-width: 393px) and (device-height: 852px) and (resolution: 3dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait), (device-width: 428px) and (device-height: 926px) and (resolution: 3dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait), (device-width: 430px) and (device-height: 932px) and (resolution: 3dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1080x2340.png"
          media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait), (device-width: 360px) and (device-height: 780px) and (resolution: 3dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait), (device-width: 414px) and (device-height: 896px) and (resolution: 2dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait), (device-width: 375px) and (device-height: 667px) and (resolution: 2dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait), (device-width: 834px) and (device-height: 1194px) and (resolution: 2dppx) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/ios-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait), (device-width: 1024px) and (device-height: 1366px) and (resolution: 2dppx) and (orientation: portrait)"
        />
        {/* フォールバック（media省略）: 新機種等で上記のどのdevice-width/heightにも
            一致しない場合に備える。iOS Safariはmedia無しのapple-touch-startup-imageを
            「どれにも一致しなかった時の既定」として扱う実装がある。 */}
        <link rel="apple-touch-startup-image" href="/splash/ios-fallback.png" />
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
          /* ログイン済みヒント時のブートベール:
             プリレンダ済みのゲスト用HTMLを一瞬見せず、アプリ起動までスピナーで繋ぐ
             （リロードのたびに画面がこまめに切り替わる問題の対策）。
             解除は app/_layout.tsx のマウント時 effect（保険で6秒後に自動解除）。 */
          html[data-auth-boot="1"] #root { visibility: hidden; }
          html[data-auth-boot="1"] body::after {
            content: "";
            position: fixed;
            top: 50%;
            left: 50%;
            width: 34px;
            height: 34px;
            margin: -17px 0 0 -17px;
            border-radius: 50%;
            border: 3px solid var(--color-border);
            border-top-color: var(--color-primary);
            animation: romi-boot-spin 0.8s linear infinite;
          }
          @keyframes romi-boot-spin { to { transform: rotate(360deg); } }
        `}} />
      </head>
      <body>
        {/* ログイン済みヒント判定（lib/clerk-public-routes.ts hasClerkSessionHint と同じ条件）。
            children より先に同期実行され、プリレンダHTMLの描画前にベールを掛ける。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=false;var ls=window.localStorage;if(ls&&ls.getItem("manus-runtime-user-info")){h=true}else if(ls){for(var i=0;i<ls.length;i++){var k=ls.key(i);if(k&&k.toLowerCase().indexOf("clerk")!==-1){h=true;break}}}if(!h&&document.cookie&&document.cookie.indexOf("__session=")!==-1){h=true}if(h){document.documentElement.setAttribute("data-auth-boot","1");window.setTimeout(function(){document.documentElement.removeAttribute("data-auth-boot")},6000)}}catch(e){}})();`,
          }}
        />
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
