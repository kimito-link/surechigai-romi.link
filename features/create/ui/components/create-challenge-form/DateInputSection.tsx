// features/create/ui/components/create-challenge-form/DateInputSection.tsx
// 開催日入力セクション

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import { createFont } from "../../theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { DatePicker } from "@/components/molecules/date-picker";
import { UndecidedOption } from "./UndecidedOption";
import type { DateInputSectionProps } from "./types";

/**
 * 開催日入力セクション
 * 「まだ決まっていない」オプション付き
 */
export function DateInputSection({
  value,
  onChange,
  showValidationError,
  inputRef,
}: DateInputSectionProps) {
  const colors = useColors();
  const isUndecided = value === "9999-12-31";
  const hasError = showValidationError && !value.trim();

  const handleToggleUndecided = () => {
    if (isUndecided) {
      onChange("");
    } else {
      onChange("9999-12-31");
    }
  };

  return (
    <View ref={inputRef} style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
        開催日
      </Text>

      <UndecidedOption
        checked={isUndecided}
        onToggle={handleToggleUndecided}
        note="※ 日程が決まり次第、後から編集できます"
      />

      {/* 日付選択 */}
      {!isUndecided && (
        <View style={{ borderWidth: hasError ? 1 : 0, borderColor: color.accentPrimary, borderRadius: 8 }}>
          <DatePicker
            value={value}
            onChange={onChange}
            placeholder="日付を選択"
          />
        </View>
      )}
    </View>
  );
}
