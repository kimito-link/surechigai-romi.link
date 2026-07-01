import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

import { APP_HEADER_CHROME_HEIGHT } from "@/theme/tokens";
import { tabBar } from "@/theme/tokens";
import { computeAppChromeInsets } from "@/lib/layout/responsive-layout";

/** 固定ヘッダー + （タブ外なら）固定フッターの inset */
export function useAppChromeInset(extra = tabBar.chromeExtra): {
  paddingTop: number;
  paddingBottom: number;
  inTabs: boolean;
} {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === "(tabs)";
  const isWeb = Platform.OS === "web";

  const { paddingTop, paddingBottom } = computeAppChromeInsets({
    isWeb,
    inTabs,
    safeAreaTop: insets.top,
    safeAreaBottom: insets.bottom,
    headerChromeHeight: APP_HEADER_CHROME_HEIGHT,
    extra,
  });

  return { paddingTop, paddingBottom, inTabs };
}
