/**
 * 属性カテゴリのチップ（表示専用）。
 *
 * ★既存の集まりカード（events-event-card.tsx の tagChip）と同じ見た目に揃える。
 *   別の見た目を作ると「チップが2種類ある」状態になり、利用者が意味の違いを探してしまう。
 *
 * ★highlight に共通カテゴリを渡すと、その分だけ強調する。
 *   「何が一致したか」だけを示し、相性スコアのような数字は出さない
 *   （根拠を説明できない数字は信用を損なうため）。
 */
import { View, Text, StyleSheet } from "react-native";
import { categoryLabel } from "@/modules/encounter/core/category";
import { color } from "@/theme/tokens";

interface CategoryChipsProps {
  /** 表示するカテゴリ id の配列。未知 id は描かない */
  ids: readonly string[];
  /** 強調するカテゴリ id（閲覧者と一致したもの） */
  highlight?: readonly string[];
}

export function CategoryChips({ ids, highlight }: CategoryChipsProps) {
  const shown = ids.filter((id) => categoryLabel(id) !== "");
  if (shown.length === 0) return null;

  const hl = new Set(highlight ?? []);

  return (
    <View style={styles.row}>
      {shown.map((id) => {
        const on = hl.has(id);
        return (
          <View key={id} style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, on && styles.textOn]}>
              {categoryLabel(id)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: color.accentIndigo + "1A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipOn: {
    // 一致したものは輪郭を足して「同じ」であることを示す（色だけに頼らない）
    backgroundColor: color.accentIndigo + "33",
    borderWidth: 1,
    borderColor: color.accentIndigo,
  },
  text: {
    fontSize: 11,
    color: color.accentIndigo,
    fontWeight: "600",
  },
  textOn: {
    fontWeight: "800",
  },
});
