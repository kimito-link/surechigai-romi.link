/**
 * 目標タイプセレクター
 * 
 * 動員/フォロワー/同時視聴/ポイント/カスタムの選択UI
 */

import { View, Text, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";
import { createUI, createText, createFont } from "../theme/tokens";
import { goalTypeOptions } from "@/constants/goal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GoalTypeSelectorProps {
  goalType: string;
  goalUnit: string;
  onGoalTypeChange: (id: string, unit: string) => void;
  onGoalUnitChange: (unit: string) => void;
}

export function GoalTypeSelector({
  goalType,
  goalUnit,
  onGoalTypeChange,
  onGoalUnitChange,
}: GoalTypeSelectorProps) {
  const colors = useColors();
  const selectedGoalType = goalTypeOptions.find(g => g.id === goalType);

  return (
    <>
      {/* 目標タイプ選択 */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
          目標タイプ
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -4 }}
        >
          {goalTypeOptions.map((type) => (
            <Button
              key={type.id}
              variant={goalType === type.id ? "primary" : "outline"}
              onPress={() => onGoalTypeChange(type.id, type.unit)}
              style={{
                backgroundColor: goalType === type.id ? createUI.activeAccent : colors.background,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginHorizontal: 4,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: goalType === type.id ? createUI.activeAccent : createUI.inputBorder,
              }}
            >
              <MaterialIcons
                name={type.icon as any}
                size={16}
                color={goalType === type.id ? color.textWhite : colors.muted}
              />
              <Text
                style={{
                  color: goalType === type.id ? color.textWhite : colors.muted,
                  fontSize: createFont.meta,
                  marginLeft: 4,
                }}
              >
                {type.label}
              </Text>
            </Button>
          ))}
        </ScrollView>
        {selectedGoalType && (
          <Text style={{ color: colors.muted, fontSize: createFont.meta, marginTop: 8 }}>
            {selectedGoalType.description}
          </Text>
        )}
      </View>

      {/* カスタム単位入力 */}
      {goalType === "custom" && (
        <Input
          label="単位"
          value={goalUnit}
          onChangeText={onGoalUnitChange}
          placeholder="例: 人、pt、回"
          containerStyle={{ marginBottom: 16 }}
        />
      )}
    </>
  );
}
