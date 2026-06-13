/**
 * ProgressGrid Component
 * 進捗を視覚的に表示するグリッド
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import { SCREEN_WIDTH, MAX_GRID_CELLS, calculateCellSize } from "../constants";

interface ProgressGridProps {
  current: number;
  goal: number;
  unit: string;
}

export function ProgressGrid({ current, goal, unit }: ProgressGridProps) {
  const gridSize = Math.min(goal, MAX_GRID_CELLS);
  const filledCount = Math.min(current, gridSize);
  const cellSize = calculateCellSize(SCREEN_WIDTH);
  
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
              backgroundColor: index < filledCount ? color.accentPrimary : color.border,
            }}
          />
        ))}
      </View>
      <Text style={{ color: color.textSecondary, fontSize: 12, textAlign: "center", marginTop: 8 }}>
        1マス = 1{unit}
      </Text>
    </View>
  );
}
