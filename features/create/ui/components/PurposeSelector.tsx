/**
 * 目的セレクター
 * 
 * チャレンジの目的（ライブ/配信/生誕祭等）を選択するUI
 * カード形式で詳細な説明付きで選択できる
 */

import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PURPOSES, type PurposeId } from "@/constants/event-categories";
import { createUI, createFont } from "../theme/tokens";
import { Button } from "@/components/ui/button";

interface PurposeSelectorProps {
  selectedPurpose: PurposeId | null;
  onSelect: (purposeId: PurposeId) => void;
}

export function PurposeSelector({ selectedPurpose, onSelect }: PurposeSelectorProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.muted, fontSize: createFont.body, marginBottom: 8 }}>
        目的
      </Text>
      
      {/* りんく吹き出し（案内文言） */}
      <View style={{ 
        backgroundColor: `${colors.primary}10`, 
        borderLeftWidth: 3, 
        borderLeftColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: createFont.title, marginRight: 6 }}>🎀</Text>
          <Text style={{ color: colors.foreground, fontSize: createFont.meta, fontWeight: "600" }}>
            りんくからのお知らせ
          </Text>
        </View>
        <Text style={{ color: colors.foreground, fontSize: createFont.meta, lineHeight: 18 }}>
          今はライブ動員に集中しています。YouTubeプレミア同時視聴や作品リリースの反応を見る機能は、後で追加予定です。
        </Text>
      </View>
      
      <View style={{ gap: 8 }}>
        {PURPOSES.map((purpose) => {
          const isSelected = selectedPurpose === purpose.id;
          return (
            <Button
              key={purpose.id}
              variant={isSelected ? "primary" : "outline"}
              onPress={() => onSelect(purpose.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                backgroundColor: isSelected ? `${colors.primary}15` : colors.background,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.primary : createUI.inputBorder,
                minHeight: 56,
                justifyContent: "flex-start",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isSelected ? colors.primary : `${colors.muted}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: createFont.lg }}>{purpose.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isSelected ? colors.primary : colors.foreground,
                    fontSize: createFont.body,
                    fontWeight: isSelected ? "600" : "500",
                    marginBottom: 2,
                  }}
                >
                  {purpose.label}
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: createFont.meta,
                    opacity: 0.8,
                  }}
                  numberOfLines={1}
                >
                  {purpose.description}
                </Text>
              </View>
              {isSelected && (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: createFont.body }}>✓</Text>
                </View>
              )}
            </Button>
          );
        })}
      </View>
    </View>
  );
}
