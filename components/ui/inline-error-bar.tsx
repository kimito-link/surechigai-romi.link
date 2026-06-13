/**
 * インラインエラーバー
 * 管理者画面などで「⚠️ + メッセージ + 詳細」を共通表示する
 */

import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface InlineErrorBarProps {
  /** エラーメッセージ（例: error.message） */
  message: string;
  /** 補足説明（任意） */
  detail?: string;
}

export function InlineErrorBar({ message, detail }: InlineErrorBarProps) {
  const colors = useColors();

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: colors.error + "20",
        borderWidth: 1,
        borderColor: colors.error,
      }}
    >
      <Text style={{ color: colors.error, fontSize: 14, fontWeight: "600" }}>
        ⚠️ {message}
      </Text>
      {detail && (
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {detail}
        </Text>
      )}
    </View>
  );
}
