import { type ReactNode } from "react";
import { PublicWebProviders } from "@/components/providers/public-web-providers";

/**
 * Guest Web シェル用の Provider。
 * children（タブ shell 含む）を常に同一ツリーで包み、アンマウントしない。
 */
export function GuestWebProviders({ children }: { children: ReactNode }) {
  // 以前は deferTrpc の間 `<>{children}</>` を返し、idle 後に
  // `<PublicWebProviders>{children}</PublicWebProviders>` へ切り替えていた。
  // これは children の親ツリーを差し替えるため、idle 時に children
  // （＝ゲストホーム全体・LCP 要素を含む）が unmount→remount され、
  // LCP が「再ペイント時刻」に張り付いて計測がブレていた（Render Delay 97%）。
  //
  // PublicWebProviders を常に同一ツリーで mount し、children の親を固定する。
  // これで idle 時の remount が消え、LCP は初回 paint で確定する。
  return <PublicWebProviders>{children}</PublicWebProviders>;
}
