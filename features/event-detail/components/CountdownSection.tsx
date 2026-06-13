/**
 * CountdownSection Component
 * イベントまでのカウントダウン表示
 */

import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { Countdown } from "@/components/atoms/countdown";

interface CountdownSectionProps {
  eventDate: string;
  isDateUndecided: boolean;
}

export function CountdownSection({ eventDate, isDateUndecided }: CountdownSectionProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: color.border,
          overflow: "hidden",
        }}
      >
        {!isDateUndecided ? (
          <LinearGradient
            colors={["rgba(236, 72, 153, 0.1)", "rgba(139, 92, 246, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 4 }}
          >
            <Countdown targetDate={eventDate} />
          </LinearGradient>
        ) : (
          <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
            <Text style={{ color: color.accentPrimary, fontSize: 14, fontWeight: "bold" }}>日程未定</Text>
          </View>
        )}
      </View>
    </View>
  );
}
