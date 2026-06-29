import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

import { APP_HEADER_CHROME_HEIGHT } from "@/components/organisms/app-header";
import { TAB_BAR_BODY_HEIGHT } from "@/hooks/use-tab-bar-inset";

/** 固定ヘッダー + （タブ外なら）固定フッターの inset */
export function useAppChromeInset(extra = 16): {
  paddingTop: number;
  paddingBottom: number;
  inTabs: boolean;
} {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inTabs = segments[0] === "(tabs)";
  const isWeb = Platform.OS === "web";

  const paddingTop = isWeb
    ? APP_HEADER_CHROME_HEIGHT + Math.max(insets.top, 0)
    : Math.max(insets.top, 0);

  const tabBarBottom = TAB_BAR_BODY_HEIGHT + (isWeb ? 12 : Math.max(insets.bottom, 8));
  const paddingBottom = inTabs ? tabBarBottom + extra : tabBarBottom + extra;

  return { paddingTop, paddingBottom, inTabs };
}
