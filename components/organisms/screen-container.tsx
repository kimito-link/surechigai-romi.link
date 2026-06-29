import { Platform, View, type ViewProps } from "react-native";
import { useSegments } from "expo-router";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { AppHeader, type AppHeaderProps } from "@/components/organisms/app-header";
import { WebFixedTabBar } from "@/components/organisms/web-fixed-tab-bar";
import { useAppChromeInset } from "@/hooks/use-app-chrome-inset";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
  /** Web で固定ヘッダー + フッターを付ける（既定 true） */
  withChrome?: boolean;
  headerProps?: AppHeaderProps;
  headerSlot?: React.ReactNode;
  showFooter?: boolean;
}

export function ScreenContainer({
  children,
  edges = ["left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  withChrome = Platform.OS === "web",
  headerProps,
  headerSlot,
  showFooter,
  ...props
}: ScreenContainerProps) {
  const segments = useSegments();
  const inTabs = segments[0] === "(tabs)";
  const chrome = useAppChromeInset();
  const showFooterBar = showFooter ?? (withChrome && !inTabs);
  const embedHeader = withChrome && !inTabs;

  const content = (
    <SafeAreaView
      edges={
        withChrome
          ? edges
          : ["top", "left", "right", ...(inTabs ? [] : (["bottom"] as Edge[]))]
      }
      className={cn("flex-1", safeAreaClassName)}
      style={[
        { overflow: "hidden" },
        withChrome
          ? {
              paddingTop: chrome.paddingTop,
              paddingBottom: chrome.paddingBottom,
            }
          : undefined,
        style,
      ]}
    >
      <View className={cn("flex-1", className)} style={{ overflow: "hidden" }}>
        {children}
      </View>
    </SafeAreaView>
  );

  if (!withChrome) {
    return (
      <View
        className={cn("flex-1", "bg-background", containerClassName)}
        style={{ overflow: "hidden" }}
        {...props}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      className={cn("flex-1", "bg-background", containerClassName)}
      style={{ overflow: "hidden" }}
      {...props}
    >
      {embedHeader ? headerSlot ?? <AppHeader {...headerProps} /> : null}
      {content}
      {showFooterBar ? <WebFixedTabBar /> : null}
    </View>
  );
}
