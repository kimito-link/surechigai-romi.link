/**
 * ジャンルセレクター
 * 
 * チャレンジのジャンル（アイドル/アーティスト/Vtuber等）を選択するUI
 * チップ形式で視覚的に選択できる
 */

import { View, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { GENRES, type GenreId } from "@/constants/event-categories";
import { createUI, createFont } from "../theme/tokens";
import { Button } from "@/components/ui/button";

interface GenreSelectorProps {
  selectedGenre: GenreId | null;
  onSelect: (genreId: GenreId) => void;
}

export function GenreSelector({ selectedGenre, onSelect }: GenreSelectorProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
        ジャンル
      </Text>
      <Text style={{ color: colors.muted, fontSize: createFont.meta, marginBottom: 12, opacity: 0.7 }}>
        活動ジャンルを選択してください
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {GENRES.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            return (
              <Button
                key={genre.id}
                variant={isSelected ? "primary" : "outline"}
                onPress={() => onSelect(genre.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: isSelected ? genre.color : colors.background,
                  borderWidth: 1.5,
                  borderColor: isSelected ? genre.color : createUI.inputBorder,
                  minHeight: 44,
                }}
              >
                <Text style={{ fontSize: createFont.title, marginRight: 6 }}>{genre.icon}</Text>
                <Text
                  style={{
                    color: isSelected ? "#FFFFFF" : colors.foreground,
                    fontSize: createFont.body,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {genre.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
