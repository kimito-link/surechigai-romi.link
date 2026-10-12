/**
 * app/(auth)/layout.tsx — 認証ルートのレイアウト。
 *
 * ★ClerkProvider の設定（共通アカウントの心臓部）は components/SurechigaiClerkProvider.tsx に集約した。
 *   allowedRedirectOrigins に無いサービスへは**沈黙して戻れない**（エラーも出ない）ので、
 *   変えるときはそちらのコメントを先に読むこと。
 */
import { SurechigaiClerkProvider } from "@/components/SurechigaiClerkProvider";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SurechigaiClerkProvider>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </SurechigaiClerkProvider>
  );
}
