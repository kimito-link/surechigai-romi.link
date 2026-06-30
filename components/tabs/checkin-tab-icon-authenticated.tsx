import { View, Text } from "react-native";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { useMySignal } from "@/hooks/use-my-signal";
import { color, palette } from "@/theme/tokens";

/** チェックインタブ — 今日未記録バッジ */
export function CheckinTabIconAuthenticated({ iconColor }: { iconColor: string }) {
  const { data } = useMySignal();
  const needsCheckin = data && !data.checkedInToday;

  return (
    <View style={{ position: "relative" }}>
      <IconSymbol size={26} name="location.fill" color={iconColor} />
      {needsCheckin ? (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -4,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: palette.kimitoOrange,
            borderWidth: 2,
            borderColor: color.surface,
          }}
        />
      ) : null}
    </View>
  );
}
