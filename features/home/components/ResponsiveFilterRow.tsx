/**
 * レスポンシブフィルター行コンポーネント
 * - 通常: flexWrapで折り返し
 * - モバイルで要素が多い場合: 横スクロールにフォールバック
 */

import React from "react";
import { ScrollView, View } from "react-native";
import { useResponsive } from "@/hooks/use-responsive";

interface ResponsiveFilterRowProps {
  children: React.ReactNode;
  itemCount: number;
  maxWrapRowsOnMobile?: number;
}

export function ResponsiveFilterRow({
  children,
  itemCount,
  maxWrapRowsOnMobile: _maxWrapRowsOnMobile = 2,
}: ResponsiveFilterRowProps) {
  const { isMobile } = useResponsive();

  // モバイルで要素が多すぎたら横スクロール（6個以上）
  const useHorizontalScroll = isMobile && itemCount >= 6;

  if (useHorizontalScroll) {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {children}
        </View>
      </ScrollView>
    );
  }

  // 通常はwrap
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {children}
    </View>
  );
}
