/**
 * app/(app)/layout.tsx — ログイン済みトップ（`/`）など「アプリ本体」のレイアウト。
 * ClerkProvider は認証ルートと同じ設定（SurechigaiClerkProvider）を静的 import で使う。
 */
import { SurechigaiClerkProvider } from "@/components/SurechigaiClerkProvider";

export default function AppLayout({
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
