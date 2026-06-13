/**
 * PeriodFilter Component
 * 期間フィルター
 */

import { View, Text, Pressable } from "react-native";
import { color } from "@/theme/tokens";
import type { PeriodType } from "../types";

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const periodLabels: Record<PeriodType, string> = {
  weekly: "週間",
  monthly: "月間",
  all: "累計",
};

export function PeriodFilter({ period, onPeriodChange }: PeriodFilterProps) {
  return (
    <View style={{ 
      flexDirection: "row", 
      paddingHorizontal: 16, 
      paddingBottom: 12,
      gap: 8,
    }}>
      {(["weekly", "monthly", "all"] as PeriodType[]).map((p) => (
        <Pressable
          key={p}
          onPress={() => onPeriodChange(p)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: period === p ? color.accentPrimary : color.border,
          }}
        >
          <Text style={{ color: color.textWhite, fontSize: 13 }}>
            {periodLabels[p]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
