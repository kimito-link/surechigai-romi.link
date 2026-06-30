import { Platform, View } from "react-native";
import {
  APP_HEADER_CHROME_HEIGHT_COMPACT,
  APP_HEADER_CHROME_HEIGHT_FULL,
} from "@/components/organisms/app-header";
import { SCREEN_CONTEXT_BAR_HEIGHT } from "@/components/molecules/screen-context-bar";

/** Web 固定ヘッダー分のスペーサー高さ */
export function getTabHeaderSpacerHeight(options: {
  variant?: "full" | "compact";
  hasContextBar?: boolean;
}): number {
  const base =
    options.variant === "compact" ? APP_HEADER_CHROME_HEIGHT_COMPACT : APP_HEADER_CHROME_HEIGHT_FULL;
  return base + (options.hasContextBar ? SCREEN_CONTEXT_BAR_HEIGHT : 0);
}

export function TabHeaderSpacer({
  variant = "compact",
  hasContextBar = false,
}: {
  variant?: "full" | "compact";
  hasContextBar?: boolean;
}) {
  if (Platform.OS !== "web") return null;
  const h = getTabHeaderSpacerHeight({ variant, hasContextBar });
  return <View style={{ height: h }} />;
}
