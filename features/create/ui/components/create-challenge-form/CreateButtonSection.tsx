// features/create/ui/components/create-challenge-form/CreateButtonSection.tsx
// 作成ボタンセクション

import { Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { createFont } from "../../theme/tokens";
import { useColors } from "@/hooks/use-colors";
import type { CreateButtonSectionProps } from "./types";

/**
 * 作成ボタンセクション
 * グラデーション背景付きのメインアクションボタン
 */
export function CreateButtonSection({ onPress, isPending }: CreateButtonSectionProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      style={({ pressed }) => ({
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        overflow: "hidden",
        opacity: pressed && !isPending ? 0.8 : 1,
        transform: [{ scale: pressed && !isPending ? 0.97 : 1 }],
      })}
    >
      <LinearGradient
        colors={isPending ? [color.textHint, color.textHint] : [color.accentPrimary, color.accentAlt]}
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
      <Text style={{ color: colors.foreground, fontSize: createFont.title, fontWeight: "bold" }}>
        {isPending ? "作成中..." : "チャレンジを作成"}
      </Text>
    </Pressable>
  );
}
