/**
 * FormButtonsSection Component
 * フォームボタン部分（キャンセル、送信）
 */

import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { eventDetailCopy, commonCopy } from "@/constants/copy";

interface FormButtonsSectionProps {
  prefecture: string;
  gender: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function FormButtonsSection({
  prefecture,
  gender,
  isSubmitting,
  onSubmit,
  onCancel,
}: FormButtonsSectionProps) {
  const colors = useColors();
  const isDisabled = isSubmitting || !prefecture || !gender;
  
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: color.border,
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 16 }}>{commonCopy.buttons.cancel}</Text>
      </Pressable>
      <Pressable
        onPress={onSubmit}
        disabled={isDisabled}
        style={{
          flex: 1,
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          overflow: "hidden",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <LinearGradient
          colors={isDisabled ? [color.textHint, color.textDisabled] : [color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>
          {!prefecture ? eventDetailCopy.labels.prefectureRequired : eventDetailCopy.actions.participate}
        </Text>
      </Pressable>
    </View>
  );
}
