// features/create/ui/components/create-challenge-form/TemplateLinkSection.tsx
// テンプレートリンクセクション

import { Text, Pressable } from "react-native";
import { color } from "@/theme/tokens";
import { createFont } from "../../theme/tokens";
import type { TemplateLinksectionProps } from "./types";

/**
 * テンプレートリンクセクション
 * テンプレート一覧へのリンク
 */
export function TemplateLinkSection({ onPress }: TemplateLinksectionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: 12,
        padding: 12,
        alignItems: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: color.accentAlt, fontSize: createFont.body }}>
        📁 テンプレートから作成
      </Text>
    </Pressable>
  );
}
