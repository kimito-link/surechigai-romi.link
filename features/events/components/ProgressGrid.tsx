/**
 * 進捗グリッドコンポーネント
 * 目標に対する進捗を視覚的に表示するグリッド
 */
import { View, Text, Dimensions } from "react-native";
import { eventText, eventFont, eventUI } from "@/features/events/ui/theme/tokens";

const { width: screenWidth } = Dimensions.get("window");

export interface ProgressGridProps {
  /** 現在の達成数 */
  current: number;
  /** 目標数 */
  goal: number;
  /** 単位（例: "人", "pt"） */
  unit: string;
  /** グリッドの最大セル数（デフォルト: 100） */
  maxCells?: number;
  /** 塗りつぶし色（デフォルト: eventUI.badge） */
  fillColor?: string;
  /** 空セル色（デフォルト: #2D3139） */
  emptyColor?: string;
}

/** 進捗アイテムのViewModel */
export interface ProgressItemVM {
  key: string;
  label: string;
  valueText: string;
  subText?: string;
}

export function ProgressGrid({
  current,
  goal,
  unit,
  maxCells = 100,
  fillColor = eventUI.badge,
  emptyColor = "#2D3139",
}: ProgressGridProps) {
  const gridSize = Math.min(goal, maxCells);
  const filledCount = Math.min(current, gridSize);
  const cellSize = Math.floor((screenWidth - 64) / 10);

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {Array.from({ length: gridSize }).map((_, index) => (
          <View
            key={index}
            style={{
              width: cellSize - 2,
              height: cellSize - 2,
              margin: 1,
              borderRadius: 2,
              backgroundColor: index < filledCount ? fillColor : emptyColor,
            }}
          />
        ))}
      </View>
      <Text style={{ color: eventText.secondary, fontSize: eventFont.meta, textAlign: "center", marginTop: 8 }}>
        1マス = 1{unit}
      </Text>
    </View>
  );
}
