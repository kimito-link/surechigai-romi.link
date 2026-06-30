import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabBar } from "@/theme/tokens";
import { computeTabBarInset } from "@/lib/layout/responsive-layout";

/** @deprecated tabBar.bodyHeight を参照してください */
export const TAB_BAR_BODY_HEIGHT = tabBar.bodyHeight;

/** タブバー高さ（safe area 込み）。ScrollView の paddingBottom に使う。 */
export function useTabBarInset(extra = tabBar.scrollExtra): number {
  const insets = useSafeAreaInsets();
  return computeTabBarInset({
    isWeb: Platform.OS === "web",
    safeAreaBottom: insets.bottom,
    extra,
  });
}
