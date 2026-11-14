/**
 * iOS / Android 版: 認証済みタブ本体を静的に読み込む（Web 版は authenticated-screen-slot.tsx の lazy）。
 *
 * ★2026-11-14: ネイティブで lazy() のままだと、各タブを初めて開くたびに suspend して
 *   起動画面（BrandLoadingScreen）が最低 300ms 挟まり、タブ切り替えがもたついて見えた。
 */
import {
  AuthenticatedScreenFunnel,
  type AuthenticatedTabScreenName,
} from "@/components/tabs/authenticated-screen-funnel";

export function AuthenticatedScreenSlot({ screen }: { screen: AuthenticatedTabScreenName }) {
  return <AuthenticatedScreenFunnel screen={screen} />;
}
