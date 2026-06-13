/**
 * PrefectureSelector Component
 * 汎用都道府県選択ドロップダウン
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { prefectures } from "@/constants/prefectures";

export interface PrefectureSelectorProps {
  /** 選択された都道府県 */
  value: string;
  /** 値変更時のコールバック */
  onChange: (value: string) => void;
  /** ドロップダウンの表示状態 */
  isOpen: boolean;
  /** ドロップダウンの表示状態変更コールバック */
  onOpenChange: (isOpen: boolean) => void;
  /** ラベルテキスト */
  label?: string;
  /** 必須フィールドかどうか */
  required?: boolean;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 無効状態 */
  disabled?: boolean;
}

export function PrefectureSelector({
  value,
  onChange,
  isOpen,
  onOpenChange,
  label = "都道府県",
  required = false,
  placeholder = "選択してください",
  disabled = false,
}: PrefectureSelectorProps) {
  const colors = useColors();
  
  return (
    <View style={{ marginBottom: 16 }}>
      {/* ラベル */}
      {label && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ color: color.textSecondary, fontSize: 14 }}>
            {label}
          </Text>
          {required && (
            <Text style={{ color: color.accentPrimary, fontSize: 12, marginLeft: 6, fontWeight: "bold" }}>
              必須
            </Text>
          )}
        </View>
      )}

      {/* 選択ボタン */}
      <Pressable
        onPress={() => !disabled && onOpenChange(!isOpen)}
        style={{
          backgroundColor: colors.background,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: value ? color.success : required ? color.accentPrimary : color.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ color: value ? color.textWhite : color.textHint }}>
          {value || placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={color.textHint} />
      </Pressable>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200,
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <ScrollView nestedScrollEnabled>
            {prefectures.map((pref) => (
              <Pressable
                key={pref}
                onPress={() => {
                  onChange(pref);
                  onOpenChange(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                  backgroundColor: value === pref ? color.surface : "transparent",
                }}
              >
                <Text style={{ color: value === pref ? color.accentPrimary : colors.foreground }}>
                  {pref}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
