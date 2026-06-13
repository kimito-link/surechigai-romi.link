// features/create/ui/components/create-challenge-form/UndecidedOption.tsx
// 「まだ決まっていない」オプションの共通コンポーネント

import { View, Text, Pressable } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { createFont } from "../../theme/tokens";

export interface UndecidedOptionProps {
  checked: boolean;
  onToggle: () => void;
  /** ラベル（デフォルト: "まだ決まっていない"） */
  label?: string;
  /** 選択時に表示する説明文（例: "※ 決まり次第、後から編集できます"） */
  note?: string;
  /** 下余白（デフォルト: 8） */
  marginBottom?: number;
}

/**
 * ラジオ風「まだ決まっていない」オプション
 * 開催日・開催場所・チケット情報などで共通利用
 */
export function UndecidedOption({
  checked,
  onToggle,
  label = "まだ決まっていない",
  note,
  marginBottom = 8,
}: UndecidedOptionProps) {
  const colors = useColors();

  return (
    <>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          marginBottom,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: checked ? color.accentPrimary : color.textDisabled,
            backgroundColor: checked ? color.accentPrimary : "transparent",
            marginRight: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {checked && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: color.textWhite,
              }}
            />
          )}
        </View>
        <Text style={{ color: colors.muted, fontSize: createFont.body }}>
          {label}
        </Text>
      </Pressable>
      {checked && note ? (
        <Text
          style={{
            color: color.textSecondary,
            fontSize: createFont.meta,
            marginTop: 4,
          }}
        >
          {note}
        </Text>
      ) : null}
    </>
  );
}
