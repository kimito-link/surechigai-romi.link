import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** タブバー本体の高さ（アイコン＋ラベル行）。paddingBottom は別途 insets。 */
export const TAB_BAR_BODY_HEIGHT = 56;

/** タブバー高さ（safe area 込み）。ScrollView の paddingBottom に使う。 */
export function useTabBarInset(extra = 24): number {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return TAB_BAR_BODY_HEIGHT + bottomPadding + extra;
}
