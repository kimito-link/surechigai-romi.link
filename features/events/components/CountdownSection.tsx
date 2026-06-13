import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { Countdown } from "@/components/atoms/countdown";

export type CountdownSectionProps = {
  eventDate: string | Date;
  isDateUndecided: boolean;
};

export function CountdownSection({ eventDate, isDateUndecided }: CountdownSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {!isDateUndecided ? (
          <LinearGradient
            colors={["rgba(236, 72, 153, 0.1)", "rgba(139, 92, 246, 0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Countdown targetDate={eventDate} />
          </LinearGradient>
        ) : (
          <View style={styles.undecided}>
            <Text style={styles.undecidedText}>日程未定</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 4,
  },
  undecided: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  undecidedText: {
    color: color.accentPrimary,
    fontSize: 14,
    fontWeight: "bold",
  },
});
