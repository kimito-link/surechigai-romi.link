/**
 * イベントタイプセレクター
 * 
 * ソロ/グループの選択UI
 */

import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { createUI, createFont } from "../theme/tokens";
import { eventTypeOptions } from "@/constants/goal-types";
import { Button } from "@/components/ui/button";

interface EventTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventTypeSelector({ value, onChange }: EventTypeSelectorProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
        イベントタイプ
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {eventTypeOptions.map((type) => (
          <Button
            key={type.id}
            variant={value === type.id ? "primary" : "outline"}
            onPress={() => onChange(type.id)}
            style={{
              flex: 1,
              backgroundColor: value === type.id ? type.color : colors.background,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              borderWidth: 2,
              borderColor: value === type.id ? type.color : createUI.inputBorder,
            }}
          >
            <Text
              style={{
                color: value === type.id ? "#fff" : colors.muted,
                fontSize: createFont.body,
                fontWeight: "600",
              }}
            >
              {type.label}
            </Text>
          </Button>
        ))}
      </View>
    </View>
  );
}
