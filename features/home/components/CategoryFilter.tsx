/**
 * カテゴリフィルターコンポーネント
 * ホーム画面でカテゴリによるフィルタリングに使用
 * - デスクトップ: flexWrapで一覧表示
 * - スマホ/タブレット: 横スクロール
 */

import { View, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useResponsive } from "@/hooks/use-responsive";
import { homeUI, homeFont } from "@/features/home/ui/theme/tokens";
import { Button } from "@/components/ui/button";

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[] | undefined;
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

// カテゴリチップコンポーネント
function CategoryChip({ 
  active, 
  children, 
  onPress 
}: { 
  active: boolean; 
  children: React.ReactNode; 
  onPress: () => void;
}) {
  const colors = useColors();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: active ? homeUI.activeFilter : homeUI.inactiveFilter,
        minHeight: 36,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: homeFont.meta }}>{children}</Text>
    </Button>
  );
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { isDesktop } = useResponsive();
  
  if (!categories || categories.length === 0) return null;
  
  // レガシーカテゴリー（「ホスト」「キャバ嬢」）を除外
  const LEGACY_CATEGORIES = ["ホスト", "キャバ嬢"];
  const filteredCategories = categories.filter((cat) => !LEGACY_CATEGORIES.includes(cat.name));
  
  // チップコンテンツ
  const content = (
    <View style={{ 
      flexDirection: "row", 
      flexWrap: isDesktop ? "wrap" : "nowrap", 
      gap: 8 
    }}>
      <CategoryChip 
        active={selectedCategory === null} 
        onPress={() => onSelectCategory(null)}
      >
        全カテゴリ
      </CategoryChip>
      
      {filteredCategories.map((cat) => (
        <CategoryChip 
          key={cat.id} 
          active={selectedCategory === cat.id} 
          onPress={() => onSelectCategory(cat.id)}
        >
          {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
        </CategoryChip>
      ))}
    </View>
  );
  
  // デスクトップはwrap、モバイルは横スクロール
  if (isDesktop) {
    return (
      <View style={{ marginTop: 8, marginHorizontal: 16 }}>
        {content}
      </View>
    );
  }
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled={true}
      style={{ marginTop: 8, marginHorizontal: 16 }}
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {content}
    </ScrollView>
  );
}
