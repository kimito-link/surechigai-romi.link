/**
 * フィルターボタンコンポーネント
 * ホーム画面でチャレンジのフィルタリングに使用
 */

import { Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { homeUI, homeText, homeFont } from "@/features/home/ui/theme/tokens";
import { Button } from "@/components/ui/button";

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterButton({ label, active, onPress }: FilterButtonProps) {
  const colors = useColors();
  return (
    <Button
      variant="ghost"
      size="md"
      onPress={onPress}
      style={{
        // UXガイドライン: 最小44pxのタップエリア
        minHeight: 44,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 22,
        backgroundColor: active ? homeText.accent : homeUI.border,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: homeFont.body, fontWeight: active ? "bold" : "normal" }}>
        {label}
      </Text>
    </Button>
  );
}
