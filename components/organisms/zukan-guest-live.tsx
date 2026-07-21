/**
 * ゲスト向け「みんなの現在地」ヒーロー表示。
 * ZukanGuestPreview(架空モック)を廃止し、認証済みと同じ JapanBlockMap + 実データで置き換える。
 * defer境界対策は NavLivePrefecturePanel と完全同型（useTrpcReady ゲート必須。
 * enabled:false では "Unable to find tRPC Context" を防げない）。
 *
 * 地図の幅は onLayout（ResizeObserverベース）での自己計測をやめ、呼び出し元
 * (OneTapGuestShell)がヒーロー地図ペインの実幅を計算で求めて availableWidth として
 * 渡す設計にしている。Suspense境界を挟む構成で onLayout が一度も発火しないことが
 * 実機検証で判明したため（2026-07-20、デスクトップで地図がウィンドウ幅基準の
 * サイズ(≈991px)のまま464px幅のペインからはみ出しoverflow:hiddenで見切れる不具合）。
 */
import { View, Text, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { navigate } from "@/lib/navigation";
import { LazyJapanBlockMap } from "@/lib/lazy-heavy-components";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { prefectureShortLabel } from "@/modules/encounter/core/prefecture-labels";
import { color, palette } from "@/theme/tokens";

const EMPTY_SET: Set<string> = new Set();
/**
 * 地図の上限キャップ。avail=min(availableWidth-24, HERO_MAX_MAP_WIDTH)の上限側なので、
 * 「上げれば地図が大きくなる」わけではない(現行のペイン幅ではavailableWidth側が常に
 * ボトルネックで無関係)。760は「超ワイド画面での間延び防止」と「13行の地図高さ729pxが
 * 1080pディスプレイの実効ビューポート内に収まる」ことを目的にした縮小方向の調整
 * (旧1040では1920px幅でcellSize71px・地図高さ989pxとなりCTA等が画面外に押し出されていた)。
 * 詳細はdocs/zukan-map-larger-DESIGN.md参照。
 */
const HERO_MAX_MAP_WIDTH = 760;
const TOP_CHIPS_COUNT = 5;

type ZukanGuestLiveProps = {
  /** ヒーロー地図ペインの実幅（OneTapGuestShellのrender propから渡される） */
  availableWidth?: number;
};

export function ZukanGuestLive({ availableWidth }: ZukanGuestLiveProps) {
  const trpcReady = useTrpcReady();
  if (!trpcReady) return <ZukanGuestLiveShell availableWidth={availableWidth} />;
  return <ZukanGuestLiveInner availableWidth={availableWidth} />;
}

function ZukanGuestLiveShell({ availableWidth }: ZukanGuestLiveProps) {
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
          availableWidth={availableWidth}
          maxMapWidth={HERO_MAX_MAP_WIDTH}
        />
      </View>
    </View>
  );
}

function ZukanGuestLiveInner({ availableWidth }: ZukanGuestLiveProps) {
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

      <View style={styles.mapWrap}>
        <LazyJapanBlockMap
          visitedPrefSet={EMPTY_SET}
          encounteredPrefSet={EMPTY_SET}
          activePrefSet={activePrefSet}
          encounterCountMap={activeCountMap}
          onPressPrefecture={(pref) => navigate.toZukanPrefecture(pref)}
          availableWidth={availableWidth}
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
