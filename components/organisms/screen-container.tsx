import { Platform, View, type ViewProps } from "react-native";
import { useSegments } from "expo-router";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { AppHeader, type AppHeaderProps } from "@/components/organisms/app-header";
import { WebFixedTabBar } from "@/components/organisms/web-fixed-tab-bar";
import { useAppChromeInset } from "@/hooks/use-app-chrome-inset";
import { NativeSubpageBar } from "@/components/molecules/native-subpage-bar";

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
  /**
   * ネイティブのタブ外画面で、上に「戻る＋画面名」の帯を出すときの画面名。
   * 省略時は headerProps.title を使う。どちらも無ければ帯は出さない
   * （利用規約など、画面側で戻るボタンを持っているページ向け）。
   */
  nativeTitle?: string;
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
  nativeTitle,
  ...props
}: ScreenContainerProps) {
  const segments = useSegments();
  const inTabs = segments[0] === "(tabs)";
  const chrome = useAppChromeInset();
  const showFooterBar = showFooter ?? (withChrome && !inTabs);
  const embedHeader = withChrome && !inTabs;
  const subpageTitle = nativeTitle ?? headerProps?.title;
  const showNativeSubpageBar =
    Platform.OS !== "web" && !withChrome && !inTabs && Boolean(subpageTitle);

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
      {showNativeSubpageBar ? <NativeSubpageBar title={subpageTitle as string} /> : null}
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
