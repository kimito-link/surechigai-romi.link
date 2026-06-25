/**
 * 軌跡マップ画面
 * すれちがいロミ MVP
 *
 * Web: 保存済みの正確な lat/lng/accuracyM を OpenStreetMap タイル上に表示する。
 * Native: 地図SDK導入まではプレースホルダ表示。
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { useCallback, useMemo } from "react";
import Svg, { Polyline } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { GlobalLoginGate } from "@/components/organisms/global-login-gate";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color } from "@/theme/tokens";

const TILE_SIZE = 256;
const MAP_ZOOM = 18;
const MAX_TILE_LAT = 85.05112878;

type TrailPoint = {
  id: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  recordedAt: Date | string;
};

type Pixel = {
  x: number;
  y: number;
};

type VisibleTile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function latLngToWorldPixel(lat: number, lng: number, zoom: number): Pixel {
  const clampedLat = clamp(lat, -MAX_TILE_LAT, MAX_TILE_LAT);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function getVisibleTiles(
  center: TrailPoint,
  mapWidth: number,
  mapHeight: number,
  zoom: number
): { tiles: VisibleTile[]; topLeft: Pixel } {
  const centerPixel = latLngToWorldPixel(center.lat, center.lng, zoom);
  const topLeft = {
    x: centerPixel.x - mapWidth / 2,
    y: centerPixel.y - mapHeight / 2,
  };

  const minX = Math.floor(topLeft.x / TILE_SIZE);
  const maxX = Math.floor((topLeft.x + mapWidth) / TILE_SIZE);
  const minY = Math.floor(topLeft.y / TILE_SIZE);
  const maxY = Math.floor((topLeft.y + mapHeight) / TILE_SIZE);
  const tileCount = 2 ** zoom;
  const tiles: VisibleTile[] = [];

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (y < 0 || y >= tileCount) continue;
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${x}:${y}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: x * TILE_SIZE - topLeft.x,
        top: y * TILE_SIZE - topLeft.y,
      });
    }
  }

  return { tiles, topLeft };
}

function metersPerPixelAtLat(lat: number, zoom: number): number {
  return (
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) /
    2 ** zoom
  );
}

function projectPoint(point: TrailPoint, topLeft: Pixel, zoom: number): Pixel {
  const pixel = latLngToWorldPixel(point.lat, point.lng, zoom);
  return {
    x: pixel.x - topLeft.x,
    y: pixel.y - topLeft.y,
  };
}

function formatDateTime(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPlace(point: TrailPoint): string {
  const place = [point.prefecture, point.municipality].filter(Boolean).join(" ");
  return place || "記録地点";
}

function formatCoordinate(point: TrailPoint): string {
  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
}

/** Native プレースホルダ */
function NativePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <MaterialIcons name="map" size={64} color={color.textMuted} />
      <Text style={styles.placeholderTitle}>軌跡マップ</Text>
      <Text style={styles.placeholderSubtitle}>
        アプリ版で近日対応予定です{"\n"}Web ブラウザからお楽しみください
      </Text>
    </View>
  );
}

function PrecisionTileMap({
  locations,
}: {
  locations: TrailPoint[];
}) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.max(320, Math.min(width - 32, 980));
  const mapHeight = width < 640 ? 430 : 560;
  const latest = locations[0];

  const { tiles, topLeft } = useMemo(
    () => getVisibleTiles(latest, mapWidth, mapHeight, MAP_ZOOM),
    [latest, mapHeight, mapWidth]
  );

  const projected = useMemo(
    () =>
      locations.slice(0, 80).map((point, index) => ({
        point,
        index,
        pixel: projectPoint(point, topLeft, MAP_ZOOM),
      })),
    [locations, topLeft]
  );

  const visiblePoints = projected.filter(
    ({ pixel }) =>
      pixel.x >= -24 &&
      pixel.x <= mapWidth + 24 &&
      pixel.y >= -24 &&
      pixel.y <= mapHeight + 24
  );
  const latestPosition = projected[0]?.pixel ?? { x: mapWidth / 2, y: mapHeight / 2 };
  const metersPerPixel = metersPerPixelAtLat(latest.lat, MAP_ZOOM);
  const accuracyRadius = clamp((latest.accuracyM ?? 25) / metersPerPixel, 22, 180);
  const trailLine = visiblePoints
    .slice()
    .reverse()
    .map(({ pixel }) => `${pixel.x},${pixel.y}`)
    .join(" ");

  return (
    <View style={[styles.mapFrame, { width: mapWidth, height: mapHeight }]}>
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.url }}
          style={[
            styles.mapTile,
            {
              left: tile.left,
              top: tile.top,
            },
          ]}
        />
      ))}

      <View pointerEvents="none" style={styles.mapTint} />

      {trailLine ? (
        <Svg
          pointerEvents="none"
          width={mapWidth}
          height={mapHeight}
          style={styles.svgOverlay}
        >
          <Polyline
            points={trailLine}
            fill="none"
            stroke={color.accentIndigo}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.82}
          />
        </Svg>
      ) : null}

      <View
        pointerEvents="none"
        style={[
          styles.accuracyCircle,
          {
            width: accuracyRadius * 2,
            height: accuracyRadius * 2,
            borderRadius: accuracyRadius,
            left: latestPosition.x - accuracyRadius,
            top: latestPosition.y - accuracyRadius,
          },
        ]}
      />

      {visiblePoints
        .filter(({ index }) => index !== 0)
        .map(({ point, pixel, index }) => (
          <View
            key={`${point.id}:${index}`}
            style={[
              styles.historyDot,
              {
                left: pixel.x - 5,
                top: pixel.y - 5,
              },
            ]}
          />
        ))}

      <View
        style={[
          styles.latestMarker,
          {
            left: latestPosition.x - 22,
            top: latestPosition.y - 22,
          },
        ]}
      >
        <MaterialIcons name="my-location" size={24} color={color.textWhite} />
      </View>

      <View style={styles.mapInfoPanel}>
        <Text style={styles.mapInfoEyebrow}>最新の足あと</Text>
        <Text style={styles.mapInfoTitle} numberOfLines={1}>
          {formatPlace(latest)}
        </Text>
        <Text style={styles.mapInfoSub} numberOfLines={1}>
          {formatDateTime(latest.recordedAt)}
          {latest.accuracyM ? ` / 精度 ±${Math.round(latest.accuracyM)}m` : ""}
        </Text>
      </View>

      <View style={styles.zoomBadge}>
        <MaterialIcons name="layers" size={16} color={color.textWhite} />
        <Text style={styles.zoomBadgeText}>z{MAP_ZOOM}</Text>
      </View>

      <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

/** Web用軌跡マップ */
function WebTrailMap({
  visited,
  locations,
  isFetching,
  onRefresh,
}: {
  visited: {
    prefecture: string | null;
    visitCount: number;
    lastVisitedAt: Date | string;
  }[];
  locations: TrailPoint[];
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const total = visited.reduce((s, v) => s + v.visitCount, 0);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={onRefresh}
          tintColor={color.accentIndigo}
        />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {locations.length > 0 ? (
        <PrecisionTileMap locations={locations} />
      ) : (
        <View style={styles.emptyMap}>
          <MaterialIcons name="near-me-disabled" size={48} color={color.textMuted} />
          <Text style={styles.emptyTitle}>まだ正確な足あとがありません</Text>
          <Text style={styles.emptyText}>
            チェックインすると、道路や建物の位置まで辿れる精度で記録されます
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentIndigo }]}>
            {visited.length}
          </Text>
          <Text style={styles.summaryLabel}>訪問都道府県</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.accentAlt }]}>
            {total}
          </Text>
          <Text style={styles.summaryLabel}>総チェックイン</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: color.success }]}>
            {locations.length}
          </Text>
          <Text style={styles.summaryLabel}>表示中の足あと</Text>
        </View>
      </View>

      {locations.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>最近の正確な記録</Text>
          {locations.slice(0, 12).map((point, index) => (
            <View key={point.id} style={styles.trailRow}>
              <View style={[styles.trailDot, index === 0 && styles.trailDotLatest]} />
              <View style={styles.trailInfo}>
                <Text style={styles.trailPref} numberOfLines={1}>
                  {formatPlace(point)}
                </Text>
                <Text style={styles.trailDate} numberOfLines={1}>
                  {formatDateTime(point.recordedAt)} / {formatCoordinate(point)}
                </Text>
              </View>
              <View style={styles.trailCountBadge}>
                <Text style={styles.trailCountText}>
                  {point.accuracyM ? `±${Math.round(point.accuracyM)}m` : "精度不明"}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

export default function MapScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  const {
    data: areasData,
    refetch: refetchAreas,
    isFetching: isFetchingAreas,
  } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const {
    data: trailData,
    refetch: refetchTrail,
    isFetching: isFetchingTrail,
  } = trpc.zukan.myTrail.useQuery({ limit: 120 }, {
    enabled: isAuthenticated,
  });

  const onRefresh = useCallback(() => {
    void Promise.all([refetchAreas(), refetchTrail()]);
  }, [refetchAreas, refetchTrail]);

  const visited = areasData?.visited ?? [];
  const locations = trailData?.locations ?? [];

  if (!isAuthReadyForUI) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader title="軌跡" showCharacters={false} isDesktop={isDesktop} showMenu />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <GlobalLoginGate
        title="軌跡"
        subtitle={`チェックインした場所が\n地図に刻まれます`}
        headerTitle="軌跡"
        isDesktop={isDesktop}
      />
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="軌跡"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      {Platform.OS !== "web" ? (
        <NativePlaceholder />
      ) : (
        <WebTrailMap
          visited={visited}
          locations={locations}
          isFetching={isFetchingAreas || isFetchingTrail}
          onRefresh={onRefresh}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    color: color.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholderSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  mapFrame: {
    backgroundColor: color.surfaceDark,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: color.borderAlt,
    marginBottom: 16,
  },
  mapTile: {
    position: "absolute",
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  mapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.bg + "55",
  },
  svgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  accuracyCircle: {
    position: "absolute",
    borderWidth: 2,
    borderColor: color.accentIndigo,
    backgroundColor: color.accentIndigo + "22",
  },
  historyDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.accentAlt,
    borderWidth: 2,
    borderColor: color.textWhite,
  },
  latestMarker: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: color.accentIndigo,
    borderWidth: 3,
    borderColor: color.textWhite,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color.shadowBlack,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
  },
  mapInfoPanel: {
    position: "absolute",
    left: 12,
    top: 12,
    maxWidth: 320,
    backgroundColor: color.surface + "ee",
    borderWidth: 1,
    borderColor: color.borderAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapInfoEyebrow: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 3,
  },
  mapInfoTitle: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  mapInfoSub: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  zoomBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: color.surface + "dd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  zoomBadgeText: {
    color: color.textWhite,
    fontSize: 11,
    fontWeight: "700",
  },
  mapAttribution: {
    position: "absolute",
    left: 8,
    bottom: 6,
    color: color.textWhite,
    fontSize: 10,
    backgroundColor: color.bg + "99",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  emptyMap: {
    width: "100%",
    maxWidth: 980,
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
    maxWidth: 980,
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
  summaryNum: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: color.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    width: "100%",
    maxWidth: 980,
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  trailRow: {
    width: "100%",
    maxWidth: 980,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: color.surface,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: color.border,
  },
  trailDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: color.accentAlt,
    marginRight: 12,
  },
  trailDotLatest: {
    backgroundColor: color.accentIndigo,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trailInfo: {
    flex: 1,
    minWidth: 0,
  },
  trailPref: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  trailDate: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  trailCountBadge: {
    backgroundColor: color.accentIndigo + "22",
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  trailCountText: {
    color: color.accentIndigo,
    fontSize: 11,
    fontWeight: "800",
  },
});
