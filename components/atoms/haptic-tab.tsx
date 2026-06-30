import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import { hrefToTabPrefetchKey, usePrefetchTab } from "@/hooks/use-tab-prefetch";

export function HapticTab(props: BottomTabBarButtonProps) {
  const prefetchTab = usePrefetchTab();

  return (
    <PlatformPressable
      {...props}
      accessibilityRole="button"
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        const href = typeof props.href === "string" ? props.href : undefined;
        const tab = hrefToTabPrefetchKey(href);
        if (tab) prefetchTab(tab);
        props.onPressIn?.(ev);
      }}
    />
  );
}
