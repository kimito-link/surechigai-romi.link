/**
 * lib/premium-features.ts
 *
 * プレミアム機能のクライアント側の単一正本。
 * 境界線の正本は docs/ENTITLEMENTS.md で、この表はそれを写したもの。
 *
 * 以前は docs/cost-and-ads-ltv-SPEC.md と docs/ENTITLEMENTS.md の両方が
 * このファイルを参照していたのに実体が無く、SPEC を信じた実装が空振りしていた。
 *
 * 責務はここに書いた3つだけ。含めないもの:
 * - 購入処理（RevenueCat の呼び出しは購入画面のローカル）
 * - サーバー側の判定（modules/encounter/db/premium-queries.ts の isUserPremium が正）
 * - 価格情報（ストアAPIから取得。ハードコードしない）
 */
import { trpc } from "@/lib/trpc";

export type PremiumFeatureKey =
  | "adFree"
  | "advancedStats"
  | "export"
  | "markerCustom";

export const PREMIUM_FEATURES: Record<
  PremiumFeatureKey,
  { label: string; description: string; shipped: boolean }
> = {
  adFree: {
    label: "広告を表示しない",
    description: "協賛カード・お知らせカードが出なくなります。",
    shipped: true,
  },
  export: {
    label: "足あとの書き出し",
    description: "GPX / GeoJSON で、記録した足あとを持ち出せます。",
    shipped: true,
  },
  advancedStats: {
    label: "詳しい記録の眺め",
    description: "移動の統計をより細かく見られます。",
    shipped: false,
  },
  markerCustom: {
    label: "足あとの印を選ぶ",
    description: "地図に落ちる印の見た目を変えられます。",
    shipped: false,
  },
};

/**
 * プレミアムかどうか。
 *
 * **必ずフェイルクローズ**。読み込み中・エラー・未認証・tRPC未準備のいずれも false。
 * 「TrpcReady のデフォルトが true で未準備時に走ってしまう」地雷を踏んだ経緯があるため、
 * ここでは isSuccess を明示的に確認する。
 */
export function useIsPremium(): { isPremium: boolean; isLoading: boolean } {
  const query = trpc.premium.status.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  return {
    isPremium: query.isSuccess ? Boolean(query.data?.isPremium) : false,
    isLoading: query.isLoading,
  };
}

/**
 * 機能が使えるか。
 * 現状は isPremium の素通しだが、機能別の段階解放をやるときの差し込み口。
 */
export function canUseFeature(
  feature: PremiumFeatureKey,
  isPremium: boolean,
): boolean {
  if (!PREMIUM_FEATURES[feature].shipped) return false;
  return isPremium;
}
