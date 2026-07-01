import { Platform, View, useWindowDimensions } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { computeTabHeaderSpacerHeight } from "@/lib/layout/header-chrome";

export { computeTabHeaderSpacerHeight as getTabHeaderSpacerHeight } from "@/lib/layout/header-chrome";

/** Web 固定ヘッダー分のスペーサー高さ */
export function TabHeaderSpacer({
  variant = "compact",
  hasContextBar = false,
  showLoginButton = false,
}: {
  variant?: "full" | "compact";
  hasContextBar?: boolean;
  /** 未ログイン時のログインボタン2段目（checkin 等） */
  showLoginButton?: boolean;
}) {
  const { width } = useWindowDimensions();
  const { user, isAuthReadyForUI } = useAuth();

  if (Platform.OS !== "web") return null;

  const hasLoggedInAccountRow = Boolean(isAuthReadyForUI && user);
  const hasLoginButtonRow = Boolean(showLoginButton && isAuthReadyForUI && !user);

  const h = computeTabHeaderSpacerHeight({
    variant,
    hasContextBar,
    windowWidth: width,
    hasLoggedInAccountRow,
    hasLoginButtonRow,
  });

  return <View style={{ height: h }} accessibilityElementsHidden importantForAccessibility="no" />;
}
