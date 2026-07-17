/**
 * ゲスト向け「みんなの現在地」ヒーロー表示。
 * ZukanGuestPreview(架空モック)を廃止し、認証済みと同じ JapanBlockMap + 実データで置き換える。
 * defer境界対策は NavLivePrefecturePanel と完全同型（useTrpcReady ゲート必須。
 * enabled:false では "Unable to find tRPC Context" を防げない）。
 */
import { useState } from "react";
import { View, Text, StyleSheet, type LayoutChangeEvent } from "react-native";
import { trpc } from "@/lib/trpc";
import { navigate } from "@/lib/navigation";
import { LazyJapanBlockMap } from "@/lib/lazy-heavy-components";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { prefectureShortLabel } from "@/modules/encounter/core/prefecture-labels";
import { color, palette } from "@/theme/tokens";

const EMPTY_SET: Set<string> = new Set();
const HERO_MAX_MAP_WIDTH = 1040;
const TOP_CHIPS_COUNT = 5;

export function ZukanGuestLive() {
  const trpcReady = useTrpcReady();
  if (!trpcReady) return <ZukanGuestLiveShell />;
  return <ZukanGuestLiveInner />;
}

function ZukanGuestLiveShell() {
  return (
    <View style={styles.root}>
      <View style={styles.liveRow}>
        <Text style={styles.liveText}>公開中の足あとを集計中…</Text>
      </View>
      <View style={styles.mapWrap}>
        <LazyJapanBlockMap
          visitedPrefSet={EMPTY_SET}
          encounteredPrefSet={EMPTY_SET}
          onPressPrefecture={() => {}}
          maxMapWidth={HERO_MAX_MAP_WIDTH}
        />
      </View>
    </View>
  );
}

function ZukanGuestLiveInner() {
  const [mapWidth, setMapWidth] = useState(0);
  const { data, isLoading } = trpc.zukan.activePrefectures.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  const prefectures = data?.prefectures ?? [];
  const totalPeople = data?.totalPeople ?? 0;
  const activePrefSet = new Set(prefectures.map((row) => row.prefecture));
  const activeCountMap = Object.fromEntries(
    prefectures.map((row) => [row.prefecture, row.peopleCount]),
  );
  const topChips = [...prefectures]
    .sort((a, b) => b.peopleCount - a.peopleCount)
    .slice(0, TOP_CHIPS_COUNT);

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const measured = Math.round(event.nativeEvent.layout.width);
    if (measured > 0 && measured !== mapWidth) setMapWidth(measured);
  };

  return (
    <View style={styles.root}>
      <View style={styles.liveRow}>
        <Text style={styles.liveText}>
          {isLoading
            ? "公開中の足あとを集計中…"
            : totalPeople > 0
              ? `いま ${totalPeople} 人が、現在地を公開中`
              : "まだ今日の足あとがありません。最初の1人になろう"}
        </Text>
      </View>

      <View style={styles.mapWrap} onLayout={handleMapLayout}>
        <LazyJapanBlockMap
          visitedPrefSet={EMPTY_SET}
          encounteredPrefSet={EMPTY_SET}
          activePrefSet={activePrefSet}
          encounterCountMap={activeCountMap}
          onPressPrefecture={(pref) => navigate.toZukanPrefecture(pref)}
          availableWidth={mapWidth || undefined}
          maxMapWidth={HERO_MAX_MAP_WIDTH}
        />
      </View>

      {topChips.length > 0 ? (
        <View style={styles.chipRow}>
          {topChips.map((row) => (
            <View key={row.prefecture} style={styles.chip}>
              <Text style={styles.chipText}>
                {prefectureShortLabel(row.prefecture)} {row.peopleCount}人
              </Text>
              {row.liveCount > 0 ? <View style={styles.liveDot} /> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    gap: 8,
  },
  liveRow: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  mapWrap: {
    width: "100%",
    alignItems: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  chipText: {
    color: color.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.kimitoOrange,
  },
});
