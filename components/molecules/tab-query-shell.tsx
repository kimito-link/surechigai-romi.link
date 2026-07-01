/**
 * タブ画面共通: loading / empty / content の3状態を分離する薄いシェル。
 * fetch 中に empty 文言が一瞬出る問題を防ぐ。
 */
import type { ReactNode } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { color } from "@/theme/tokens";

type TabQueryShellProps = {
  isLoading: boolean;
  isEmpty: boolean;
  /** true のとき fetch 中でも children を表示（再訪問 SWR） */
  keepContentWhileRefetching?: boolean;
  loadingFallback?: ReactNode;
  emptyFallback: ReactNode;
  children: ReactNode;
  minHeight?: number;
};

export function TabQueryShell({
  isLoading,
  isEmpty,
  keepContentWhileRefetching = false,
  loadingFallback,
  emptyFallback,
  children,
  minHeight = 320,
}: TabQueryShellProps) {
  const showLoading = isLoading && !keepContentWhileRefetching;

  if (showLoading) {
    return (
      <View testID="tab-query-loading" style={[styles.loadingWrap, { minHeight }]}>
        {loadingFallback ?? <ActivityIndicator size="large" color={color.accentPrimary} />}
      </View>
    );
  }

  if (isEmpty) {
    return <>{emptyFallback}</>;
  }

  return <>{children}</>;
}

/** 地図系タブ向けの大きめスケルトン */
export function TabMapLoadingFallback({ minHeight = 320 }: { minHeight?: number }) {
  return <ChunkFallback minHeight={minHeight} />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
