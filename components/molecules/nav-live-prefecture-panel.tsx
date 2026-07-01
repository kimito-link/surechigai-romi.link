/**
 * サイドナビ上部 — 「みんなの現在地」を星野ロミ型で即座に見せる（価値ファースト）。
 */
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { prefectureShortLabel } from "@/modules/encounter/core/prefecture-labels";
import { AUTHENTICATED_QUERY_OPTIONS, isInitialQueryLoad } from "@/lib/authenticated-query-options";
import { useAuth } from "@/hooks/use-auth";

const MAX_CHIPS = 4;

export function NavLivePrefecturePanel() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.zukan.activePrefectures.useQuery(undefined, {
    ...(isAuthenticated ? AUTHENTICATED_QUERY_OPTIONS : { retry: 1, staleTime: 60_000 }),
  });

  const prefectures = data?.prefectures ?? [];
  const totalPeople = data?.totalPeople ?? 0;
  const initialLoad = isInitialQueryLoad(isLoading, data);

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/zukan")}
      style={({ pressed, hovered }) => [
        styles.panel,
        Platform.OS === "web" && (hovered as boolean) && styles.panelHover,
        pressed && { opacity: 0.9 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="みんなの現在地を図鑑で見る"
    >
      <View style={styles.headRow}>
        <MaterialIcons name="place" size={14} color={palette.kimitoBlue} />
        <Text style={styles.title}>みんなの現在地</Text>
      </View>

      {initialLoad ? (
        <Text style={styles.meta}>公開中の足あとを集計中</Text>
      ) : prefectures.length === 0 ? (
        <Text style={styles.meta}>まだ誰も記録していません</Text>
      ) : (
        <>
          <Text style={styles.meta}>
            {totalPeople > 0 ? `${totalPeople} 人が記録中` : "公開中の足あと"}
          </Text>
          <View style={styles.chips}>
            {prefectures.slice(0, MAX_CHIPS).map((row) => (
              <View key={row.prefecture} style={styles.chip}>
                <Text style={styles.chipText}>{prefectureShortLabel(row.prefecture)}</Text>
                {row.liveCount > 0 ? <View style={styles.liveDot} /> : null}
              </View>
            ))}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlue + "10",
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "28",
    gap: 6,
  },
  panelHover: {
    backgroundColor: palette.kimitoBlue + "16",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.kimitoBlue,
  },
  meta: {
    fontSize: 10,
    fontWeight: "600",
    color: color.textMuted,
    lineHeight: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  chipText: {
    fontSize: 10,
    fontWeight: "800",
    color: color.textPrimary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.kimitoOrange,
  },
});
