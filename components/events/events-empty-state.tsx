import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color } from "@/theme/tokens";

export function EventsEmptyState({ loading, message }: { loading?: boolean; message?: string }) {
  return (
    <View style={styles.emptyBox}>
      <MaterialIcons
        name={loading ? "hourglass-empty" : "event-note"}
        size={32}
        color={color.textHint}
      />
      <Text style={styles.emptyText}>{loading ? "読み込み中..." : message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    color: color.textHint,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
