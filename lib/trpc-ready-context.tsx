import { createContext, useContext } from "react";

/**
 * ゲスト `/` は tRPC Provider を window load + idle まで意図的に mount しない
 * （components/providers/guest-web-providers.tsx の defer 境界）。
 * この窓の間に `trpc.*.useQuery` を呼ぶコンポーネントは
 * "Unable to find tRPC Context" で落ちる（`enabled: false` でも防げない）。
 *
 * 到達経路が defer 境界の外側（Provider が常に存在する）なら true のままでよいので
 * デフォルトは true。defer 境界の内側だけが明示的に false を配る。
 */
const TrpcReadyContext = createContext(true);

export const TrpcReadyProvider = TrpcReadyContext.Provider;

export function useTrpcReady(): boolean {
  return useContext(TrpcReadyContext);
}
