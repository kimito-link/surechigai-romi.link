/**
 * カテゴリセレクター
 * 
 * チャレンジのカテゴリを選択するドロップダウンUI
 */

import { View, Text, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { createUI, createText, createFont } from "../theme/tokens";
import { Button } from "@/components/ui/button";

interface Category {
  id: number;
  name: string;
}

interface CategorySelectorProps {
  categoryId: number | null;
  categories: Category[] | undefined;
  showList: boolean;
  onToggleList: () => void;
  onSelect: (categoryId: number) => void;
  /** 読み込み中はリストを開かせない・タップで開けるようにする */
  isLoading?: boolean;
}

export function CategorySelector({
  categoryId,
  categories,
  showList,
  onToggleList,
  onSelect,
  isLoading = false,
}: CategorySelectorProps) {
  const colors = useColors();

  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const canOpen = hasCategories && !isLoading;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
        カテゴリ
      </Text>
      <Button
        variant="outline"
        onPress={canOpen ? onToggleList : () => {}}
        disabled={!canOpen}
        style={{
          backgroundColor: colors.background,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: createUI.inputBorder,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: categoryId ? colors.foreground : createText.placeholder, fontSize: createFont.body }}>
          {isLoading ? "読み込み中..." : selectedCategory?.name || (hasCategories ? "カテゴリを選択" : "カテゴリがありません")}
        </Text>
        <MaterialIcons
          name={showList ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color={colors.muted}
        />
      </Button>
      {showList && categories && (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 8,
            marginTop: 4,
            borderWidth: 1,
            borderColor: createUI.inputBorder,
            maxHeight: 200,
          }}
        >
          <ScrollView nestedScrollEnabled={true}>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                onPress={() => onSelect(category.id)}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: createUI.inputBorder,
                  minHeight: 44,
                  justifyContent: "center",
                  alignItems: "flex-start",
                  borderRadius: 0,
                }}
              >
                <Text
                  style={{
                    color: categoryId === category.id ? createText.accent : colors.foreground,
                    fontSize: createFont.body,
                  }}
                >
                  {category.name}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
