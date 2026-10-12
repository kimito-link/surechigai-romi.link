/**
 * ClerkProvider の設定を1か所に集約する（認証ルート (auth) とログイン済みトップ (app) で共有）。
 *
 * ★app/(auth)/layout.tsx から**挙動を変えずに**移した。各 props の理由（domain 明示が必須・
 *   FORCE と FALLBACK の二重指定・allowedRedirectOrigins の列挙）は元のコメントのまま下に残す。
 *   ここを変えると本番のログインに直結するので、変更時は /sign-in の one-tap を実機で確認すること。
 */
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { authBrandConfig } from "@/lib/auth-brand.config";
import { surechigaiJaJP } from "@/lib/clerk-localization";
import { surechigaiClerkAppearance } from "@/lib/clerk-appearance";

const {
  afterAuthPath,
  signInPath,
  signUpPath,
  afterSignOutPath,
  allowedRedirectOrigins,
  developmentRedirectOrigins,
} = authBrandConfig;

export function SurechigaiClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      // 方式A: 共通アカウント（親ドメインで __client cookie を共有）。
      // ★サブドメイン方式なら satellite 設定は不要かつ有害
      //   （isSatellite:true は verified でない限り /v1/client/sync が落ちる）。
      //
      // ★domain明示が必須（2026-10-02実機確認）: この値が無いと、Vercelの自動
      //   プロキシ判定(本番URLが*.vercel.appで終わるか)がクライアント側で
      //   再計算され、「400 Invalid host」になる。NEXT_PUBLIC_ 接頭辞が無い
      //   CLERK_DISABLE_AUTO_PROXY はブラウザバンドルでは undefined になり効かないため、
      //   domainを明示して getAutoProxyUrlFromEnvironment の hasDomain チェックで
      //   サーバー・クライアント両方の自動判定を回避する。
      domain="clerk.kimito.link"
      allowedRedirectOrigins={
        process.env.NODE_ENV === "development"
          ? [...developmentRedirectOrigins, ...allowedRedirectOrigins]
          : allowedRedirectOrigins
      }
      allowedRedirectProtocols={["http:", "https:"]}
      signInUrl={signInPath}
      signUpUrl={signUpPath}
      // ★FORCE: どの入口から来ても着地先へ送る（最優先）。
      //   ★注意: FORCE は redirect_url より強い。姉妹サービスから送客されたとき
      //   「戻れない」事故になるので、各サービスが**自分の** sign-in を持つ設計にする。
      signInForceRedirectUrl={afterAuthPath}
      signUpForceRedirectUrl={afterAuthPath}
      // FALLBACK は FORCE が効かない経路の保険（既定の '/' 着地を防ぐ）。
      signInFallbackRedirectUrl={afterAuthPath}
      signUpFallbackRedirectUrl={afterAuthPath}
      afterSignOutUrl={afterSignOutPath}
      localization={surechigaiJaJP}
      appearance={surechigaiClerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
}
