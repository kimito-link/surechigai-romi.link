/**
 * DemoParticipantsList
 * デモチャレンジの参加者一覧
 */

import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import type { DemoParticipant } from "@/lib/demo-challenge";

interface DemoParticipantsListProps {
  participants: DemoParticipant[];
  total: number;
}

const MAX_VISIBLE = 5;

export function DemoParticipantsList({ participants, total }: DemoParticipantsListProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        参加者 ({total}人)
      </Text>
      <View style={styles.list}>
        {participants.slice(0, MAX_VISIBLE).map((participant) => (
          <View
            key={participant.id}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.muted + "30" }]}>
              <Ionicons name="person" size={20} color={colors.muted} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {participant.name}
                {participant.id === "demo_user" && (
                  <Text style={{ color: colors.primary }}> (あなた)</Text>
                )}
              </Text>
              <Text style={[styles.contribution, { color: colors.muted }]}>
                貢献: {participant.contribution}人
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: "500",
  },
  contribution: {
    fontSize: 12,
  },
});
