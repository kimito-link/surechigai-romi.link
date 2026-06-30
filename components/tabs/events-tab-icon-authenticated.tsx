import { View, Text } from "react-native";
import { IconSymbol } from "@/components/atoms/icon-symbol";
import { useMySignal } from "@/hooks/use-my-signal";
import { color } from "@/theme/tokens";

/** 集まりタブ — 参加表明中バッジ */
export function EventsTabIconAuthenticated({ iconColor }: { iconColor: string }) {
  const { data } = useMySignal();
  const count = data?.upcomingParticipationCount ?? 0;

  return (
    <View style={{ position: "relative" }}>
      <IconSymbol size={26} name="calendar" color={iconColor} />
      {count > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: color.accentPrimary,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: color.textWhite, fontSize: 10, fontWeight: "800", lineHeight: 14 }}>
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
