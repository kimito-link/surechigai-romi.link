/**
 * 保存済み足あとの座標から外部マップでルートを開くボタン。
 */
import { useCallback } from "react";
import { Pressable, Text, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { openMapsDirections } from "@/lib/navigation/open-maps-directions";
import { showAlert } from "@/lib/web-alert";
import { color } from "@/theme/tokens";

type NavigateToPlaceButtonProps = {
  lat: number;
  lng: number;
  placeLabel?: string;
  /** 履歴リスト行向け: アイコンのみ */
  compact?: boolean;
  /** チェックイン完了向け: フル幅セカンダリ */
  fullWidth?: boolean;
  label?: string;
  testID?: string;
};

export function NavigateToPlaceButton({
  lat,
  lng,
  placeLabel,
  compact = false,
  fullWidth = false,
  label = "ここへ向かう",
  testID,
}: NavigateToPlaceButtonProps) {
  const accessibilityLabel = placeLabel
    ? `${placeLabel}へ車で向かう`
    : "この場所へ車で向かう";

  const handlePress = useCallback(async () => {
    const ok = await openMapsDirections({ lat, lng, label: placeLabel });
    if (!ok) {
      showAlert("エラー", "マップを開けませんでした");
    }
  }, [lat, lng, placeLabel]);

  if (compact) {
    return (
      <Pressable
        onPress={() => void handlePress()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.compactButton,
          pressed && { opacity: 0.75 },
          Platform.OS === "web" && styles.pressableWeb,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
      >
        <MaterialIcons name="directions-car" size={20} color={color.accentIndigo} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        styles.fullButton,
        fullWidth && styles.fullWidth,
        pressed && { opacity: 0.85 },
        Platform.OS === "web" && styles.pressableWeb,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
    >
      <MaterialIcons name="directions-car" size={18} color={color.accentIndigo} />
      <Text style={styles.fullButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.accentIndigo + "55",
    backgroundColor: color.accentIndigo + "12",
    flexShrink: 0,
  },
  fullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.accentIndigo + "66",
    backgroundColor: color.accentIndigo + "10",
  },
  fullWidth: {
    width: "100%",
  },
  fullButtonText: {
    color: color.accentIndigo,
    fontSize: 15,
    fontWeight: "700",
  },
  pressableWeb: {
    cursor: "pointer",
  } as const,
});
