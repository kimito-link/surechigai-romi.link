/**
 * Web 向け軌跡マップ（自分の軌跡タブ / 公開 /u/<slug> で共有）。
 * surechigai-nico の一覧タップ後に見せる地図 UI のベース。
 */
import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import {
  PrecisionTileMap,
  fitCenterZoom,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { color, contentMaxWidth } from "@/theme/tokens";
import { TrailHistoryList } from "@/components/molecules/trail-history-list";
import { PlaceContextBar } from "@/components/molecules/place-context-bar";
import { TabMapLoadingFallback, TabQueryShell } from "@/components/molecules/tab-query-shell";
import { FootprintSheet } from "@/components/map/footprint-sheet";
import { PlaceNoteModal } from "@/components/map/place-note-modal";
import { isStatCardInteractive } from "@/components/organisms/web-trail-map-stats";
import type { LocationVisibility } from "@/modules/encounter/core/location-visibility";

export type VisitedAreaSummary = {
  prefecture: string | null;
  municipality?: string | null;
  visitCount: number;
  lastVisitedAt: Date | string;
};

type WebTrailMapProps = {
  visited: VisitedAreaSummary[];
  locations: TrailPoint[];
  /** 足あとがまだ無いときに「いまの様子」で代わりに見せる県（いま人がいる県） */
  fallbackPrefecture?: string | null;
  municipalityCount?: number;
  encounterCount?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  onRefresh?: () => void;
  userImageUrl?: string;
  topContent?: ReactNode;
  /** 履歴リストの下（ページ末尾）に差し込む。公開シェア着地でのログイン導線などに使う */
  bottomContent?: ReactNode;
  contentPaddingBottom?: number;
  emptyTitle?: string;
  emptyText?: string;
  canDeleteLocations?: boolean;
  onDeleteLocation?: (locationId: number) => void;
  deletingLocationId?: number | null;
  onToggleVisibility?: (locationId: number, next: LocationVisibility) => void;
  /** 本人のみ。場所メモを保存する（未指定ならメモ編集導線を出さない） */
  onSaveNote?: (locationId: number, placeName: string, note: string) => void;
  savingNoteLocationId?: number | null;
  updatingLocationId?: number | null;
  historyLimit?: number;
  /** 公開閲覧向け: 履歴ヘッダーに保存地点の注記 */
  showSavedLocationHint?: boolean;
  /** Zukanの切手カードから遷移: この市区町村の最新地点にフォーカスする（docs/uiux-brushup-SPEC.md §4.5） */
  focusMunicipality?: string;
  /** Check-in成功パネルから遷移: この location にフォーカスしシートを開く（docs/uiux-brushup-SPEC.md §3.2 P0） */
  focusLocationId?: number;
  /**
   * 統計カード（すれ違った人 / 図鑑 / 市区町村）のタップ先。
   *
   * ★渡されたカードだけが押せるようになる（opt-in）。
   *   この部品は自分の地図タブと公開ページ /u/<slug> の両方で使う（app/u/[slug].tsx）。
   *   他人のページで押せると閲覧者本人の図鑑へ飛んで文脈が壊れるため、
   *   着地ページ側は**渡さない**ことで非対話のまま保つ。
   */
  onStatsPress?: {
    encounters?: () => void;
    checkins?: () => void;
    municipalities?: () => void;
  };
  style?: StyleProp<ViewStyle>;
};

/** 統計カード1枚。押せるときだけ Pressable になり、押下フィードバックも付く。 */
function SummaryStatCard({
  value,
  valueColor,
  label,
  onPress,
  isLoading,
}: {
  value: ReactNode;
  valueColor: string;
  label: string;
  onPress?: () => void;
  isLoading: boolean;
}) {
  const interactive = isStatCardInteractive(onPress, isLoading);
  const body = (
    <>
      <Text style={[styles.summaryNum, { color: valueColor }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </>
  );

  if (!interactive) {
    return <View style={styles.summaryCard}>{body}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}の一覧を見る`}
    >
      {body}
    </Pressable>
  );
}

export function WebTrailMap({
  visited,
  locations,
  fallbackPrefecture = null,
  municipalityCount,
  encounterCount = 0,
  isLoading = false,
  isFetching = false,
  onRefresh,
  userImageUrl,
  topContent,
  bottomContent,
  contentPaddingBottom,
  emptyTitle = "まだ正確な足あとがありません",
  emptyText = "チェックインすると、道路や建物の位置まで辿れる精度で記録されます",
  canDeleteLocations = false,
  onDeleteLocation,
  deletingLocationId = null,
  onToggleVisibility,
  onSaveNote,
  savingNoteLocationId = null,
  updatingLocationId = null,
  historyLimit = 30,
  showSavedLocationHint = false,
  focusMunicipality,
  focusLocationId,
  onStatsPress,
  style,
}: WebTrailMapProps) {
  const total = visited.reduce((s, v) => s + v.visitCount, 0);
  const municipalityTotal =
    municipalityCount ??
    new Set(
      visited
        .map((v) => v.municipality || v.prefecture)
        .filter((name): name is string => !!name),
    ).size;

  const [zoom, setZoom] = useState(18);
  const [selectedPoint, setSelectedPoint] = useState<TrailPoint | null>(null);
  const [notePoint, setNotePoint] = useState<TrailPoint | null>(null);
  const [focusCenter, setFocusCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const appliedFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (locations.length === 0) return;
    const focusKey = `${focusMunicipality ?? ""}:${focusLocationId ?? ""}`;
    if (!focusMunicipality && focusLocationId == null) return;
    if (appliedFocusRef.current === focusKey) return;

    const target = focusLocationId != null
      ? locations.find((l) => l.id === focusLocationId)
      : locations.find((l) => (l.municipality ?? l.address ?? "") === focusMunicipality);

    if (target) {
      appliedFocusRef.current = focusKey;
      setFocusCenter({ lat: target.lat, lng: target.lng });
      setZoom(17);
      if (focusLocationId != null) {
        setSelectedPoint(target);
      }
    }
  }, [locations, focusMunicipality, focusLocationId]);

  return (
    <ScrollView
      style={style}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            tintColor={color.accentIndigo}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.scrollContent,
        contentPaddingBottom ? { paddingBottom: contentPaddingBottom } : null,
      ]}
    >
      {topContent}

      {/* その場所の「いま」（天気・ライブカメラ）。
          ★2026-08-16: 置き場所を2回外している。
          (1)足あと一覧の中 → ページの137%地点でスクロールしないと気づけない
          (2)地図の直後     → 地図コンテナが画面高いっぱい(720px)を占めるので
                              その直後もやはり画面外（実測 985px / ビューポート 720px）
          地図の「前」が唯一ファーストビューに入る位置。場所の名前を見た直後に
          「そこは今どうなっているか」が続く並びでもある。

          足あとが0件でも出す。バー側が「いま人がいる県」にフォールバックするので、
          始めたばかりの人にも意味のある情報が見える
          （データが無いと機能ごと消える＝無いのと同じ、を避ける）。 */}
      {!isLoading ? (
        <PlaceContextBar
          prefecture={locations[0]?.prefecture}
          municipality={locations[0]?.municipality}
          fallbackPrefecture={fallbackPrefecture}
        />
      ) : null}

      <TabQueryShell
        isLoading={isLoading}
        isEmpty={locations.length === 0}
        keepContentWhileRefetching={locations.length > 0}
        loadingFallback={<TabMapLoadingFallback minHeight={320} />}
        emptyFallback={
          <View style={styles.emptyMap}>
            <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
      >
        <PrecisionTileMap
          locations={locations}
          userImageUrl={userImageUrl}
          zoom={zoom}
          customCenter={focusCenter}
          onZoomChange={setZoom}
          onPointPress={setSelectedPoint}
        />
      </TabQueryShell>

      <View style={styles.summaryRow}>
        <SummaryStatCard
          value={isLoading ? "—" : encounterCount}
          valueColor={color.accentIndigo}
          label="すれ違った人"
          onPress={onStatsPress?.encounters}
          isLoading={Boolean(isLoading)}
        />
        <SummaryStatCard
          value={isLoading ? "—" : total}
          valueColor={color.accentAlt}
          label="図鑑（チェックイン）"
          onPress={onStatsPress?.checkins}
          isLoading={Boolean(isLoading)}
        />
        <SummaryStatCard
          value={isLoading ? "—" : municipalityTotal}
          valueColor={color.success}
          label="市区町村"
          onPress={onStatsPress?.municipalities}
          isLoading={Boolean(isLoading)}
        />
      </View>

      {!isLoading && locations.length > 0 ? (
        <TrailHistoryList
          locations={locations}
          limit={historyLimit}
          canManage={canDeleteLocations}
          showSavedLocationHint={showSavedLocationHint}
          onDeleteLocation={onDeleteLocation}
          onToggleVisibility={onToggleVisibility}
          deletingLocationId={deletingLocationId}
          updatingLocationId={updatingLocationId}
        />
      ) : null}

      {bottomContent}

      <FootprintSheet
        point={selectedPoint}
        visible={selectedPoint != null}
        onClose={() => setSelectedPoint(null)}
        canManage={canDeleteLocations}
        onDeleteLocation={
          onDeleteLocation
            ? (locationId) => {
                onDeleteLocation(locationId);
                setSelectedPoint(null);
              }
            : undefined
        }
        onToggleVisibility={onToggleVisibility}
        onEditNote={onSaveNote ? (p) => { setNotePoint(p); setSelectedPoint(null); } : undefined}
        isDeleting={selectedPoint != null && deletingLocationId === selectedPoint.id}
        isUpdatingVisibility={selectedPoint != null && updatingLocationId === selectedPoint.id}
      />
      {onSaveNote ? (
        <PlaceNoteModal
          visible={notePoint != null}
          currentPlaceName={notePoint?.placeName}
          currentNote={notePoint?.note}
          isSaving={notePoint != null && savingNoteLocationId === notePoint.id}
          onClose={() => setNotePoint(null)}
          onSave={(placeName, note) => {
            if (!notePoint) return;
            onSaveNote(notePoint.id, placeName, note);
            setNotePoint(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  emptyMap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    minHeight: 320,
    backgroundColor: color.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    marginBottom: 16,
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  summaryRow: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: color.border,
  },
  // 押せるカードだけに付く押下フィードバック（公開ページでは付かない）
  summaryCardPressed: {
    opacity: 0.7,
    borderColor: color.accentIndigo,
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
});
