import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions, StyleProp, ViewStyle, Pressable } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import {
  TILE_SIZE,
  MAX_TILE_LAT,
  clamp,
  fitCenterZoom,
  pixelToLatLng,
  latLngToWorldPixel,
  type TrailPoint,
} from "@/lib/map/tile-geo";

export {
  TILE_SIZE,
  MAX_TILE_LAT,
  clamp,
  fitCenterZoom,
  pixelToLatLng,
  latLngToWorldPixel,
  type TrailPoint,
} from "@/lib/map/tile-geo";

export type Pixel = {
  x: number;
  y: number;
};

type VisibleTile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

export function getVisibleTiles(
  center: { lat: number; lng: number },
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

export function metersPerPixelAtLat(lat: number, zoom: number): number {
  return (
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) /
    2 ** zoom
  );
}

export function projectPoint(point: { lat: number; lng: number }, topLeft: Pixel, zoom: number): Pixel {
  const pixel = latLngToWorldPixel(point.lat, point.lng, zoom);
  return {
    x: pixel.x - topLeft.x,
    y: pixel.y - topLeft.y,
  };
}

export function formatDateTime(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

  export function formatPlace(point: Pick<TrailPoint, "prefecture" | "municipality" | "address">): string {
    if (point.address) return point.address;
    const place = [point.prefecture, point.municipality].filter(Boolean).join(" ");
    return place || "記録地点";
  }

export function formatCoordinate(point: Pick<TrailPoint, "lat" | "lng">): string {
  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
}

  export interface PrecisionTileMapProps {
    locations: TrailPoint[];
    width?: number;
    height?: number;
    zoom?: number;
    showInfoPanel?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    customCenter?: { lat: number; lng: number };
    userImageUrl?: string;
    markerIcon?: React.ComponentProps<typeof MaterialIcons>["name"];
    /** 最新地点マーカーの一辺サイズ(px)。小さい地図で地図中心を隠さないために縮小できる。 */
    markerSize?: number;
    /** 地図クリックで座標を選べる（PC Web 向け位置修正） */
    interactive?: boolean;
    onCoordinateSelect?: (coords: { lat: number; lng: number }) => void;
  }

  export function PrecisionTileMap({
    locations,
    width: propWidth,
    height: propHeight,
    zoom = 18,
    showInfoPanel = true,
    containerStyle,
    customCenter,
    userImageUrl,
    markerIcon = "my-location",
    markerSize = 44,
    interactive = false,
    onCoordinateSelect,
  }: PrecisionTileMapProps) {
  const { width: windowWidth } = useWindowDimensions();
  const mapWidth = propWidth ?? Math.max(320, Math.min(windowWidth - 32, 980));
  const mapHeight = propHeight ?? (windowWidth < 640 ? 430 : 560);
  const isCompactMap = windowWidth < 640;
  const [showDetails, setShowDetails] = useState(false);
  
  const latest = locations[0];
  const center = customCenter ?? latest;

  const { tiles, topLeft } = useMemo(() => {
    if (!center) {
      return { tiles: [] as VisibleTile[], topLeft: { x: 0, y: 0 } };
    }
    return getVisibleTiles(center, mapWidth, mapHeight, zoom);
  }, [center, mapHeight, mapWidth, zoom]);

  const projected = useMemo(() => {
    if (!center) return [];
    return locations.slice(0, 80).map((point, index) => ({
      point,
      index,
      pixel: projectPoint(point, topLeft, zoom),
    }));
  }, [center, locations, topLeft, zoom]);

  if (!center) {
    return (
      <View
        style={[
          styles.mapFrame,
          styles.mapPlaceholder,
          { width: mapWidth, height: mapHeight },
          containerStyle,
        ]}
      >
        <MaterialIcons name="map" size={32} color={color.textMuted} />
        <Text style={styles.mapPlaceholderText}>位置を取得中…</Text>
      </View>
    );
  }

  const visiblePoints = projected.filter(
    ({ pixel }) =>
      pixel.x >= -24 &&
      pixel.x <= mapWidth + 24 &&
      pixel.y >= -24 &&
      pixel.y <= mapHeight + 24
  );
  
  const latestPosition = projected[0]?.pixel ?? { x: mapWidth / 2, y: mapHeight / 2 };

  const handleMapPress = (locationX: number, locationY: number) => {
    if (!interactive || !onCoordinateSelect) return;
    const coords = pixelToLatLng(locationX, locationY, topLeft, zoom);
    onCoordinateSelect(coords);
  };
  
  const metersPerPixel = metersPerPixelAtLat(center.lat, zoom);
  const accuracyRadius = clamp(((latest?.accuracyM ?? 25) / metersPerPixel), 22, 180);
  const trailLine = visiblePoints
    .slice()
    .reverse()
    .map(({ pixel }) => `${pixel.x},${pixel.y}`)
    .join(" ");

  return (
    <View style={[styles.mapFrame, { width: mapWidth, height: mapHeight }, containerStyle]}>
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

      {interactive ? (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.mapTapLayer]}
          onPress={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleMapPress(locationX, locationY);
          }}
          accessibilityLabel="地図をタップして位置を修正"
        />
      ) : null}

      {latest && (
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
      )}

      {visiblePoints
        .filter(({ index }) => index !== 0)
        .map(({ point, pixel, index }) => (
          <View
            key={`${point.id}:${index}`}
            pointerEvents="none"
            style={[
              styles.historyDot,
              {
                left: pixel.x - 5,
                top: pixel.y - 5,
              },
            ]}
          />
        ))}

      {latest && (
        <>
          {showDetails && (
            <View
              style={[
                styles.detailPopup,
                {
                  left: latestPosition.x - 100,
                  top: latestPosition.y - 120, // ピンの上に出す
                },
              ]}
            >
              <Text style={styles.detailTitle}>詳細座標</Text>
              <Text style={styles.detailText}>{formatPlace(latest)}</Text>
              <Text style={styles.detailText}>{formatCoordinate(latest)}</Text>
              <View style={styles.detailTriangle} />
            </View>
          )}
          <Pressable
            onPress={interactive ? undefined : () => setShowDetails(!showDetails)}
            disabled={interactive}
            style={[
              styles.latestMarker,
              {
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize * 0.2,
                left: latestPosition.x - markerSize / 2,
                top: latestPosition.y - markerSize / 2,
              },
            ]}
          >
            {userImageUrl ? (
              <Image
                source={{ uri: userImageUrl }}
                style={{
                  width: markerSize - 6,
                  height: markerSize - 6,
                  borderRadius: (markerSize - 6) * 0.16,
                }}
              />
            ) : (
              <MaterialIcons name={markerIcon} size={Math.round(markerSize * 0.55)} color={color.textWhite} />
            )}
          </Pressable>
        </>
      )}

      {showInfoPanel && latest && (
        <View
          style={[
            isCompactMap ? styles.mapInfoPanelBottom : styles.mapInfoPanel,
            { maxWidth: isCompactMap ? mapWidth - 24 : 320 },
          ]}
        >
          <Text style={styles.mapInfoEyebrow}>最新の足あと</Text>
          <Text style={styles.mapInfoTitle} numberOfLines={2}>
            {formatPlace(latest)}
          </Text>
          <Text style={styles.mapInfoSub} numberOfLines={2}>
            {formatDateTime(latest.recordedAt)}
            {latest.accuracyM ? ` / 精度 ±${Math.round(latest.accuracyM)}m` : ""}
          </Text>
        </View>
      )}

      <View pointerEvents="none" style={styles.zoomBadge}>
        <MaterialIcons name="layers" size={16} color={color.textWhite} />
        <Text style={styles.zoomBadgeText}>z{zoom}</Text>
      </View>

      <Text pointerEvents="none" style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: {
    backgroundColor: color.surfaceDark,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: color.borderAlt,
  },
  mapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: color.surface,
  },
  mapPlaceholderText: {
    color: color.textMuted,
    fontSize: 13,
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
  mapTapLayer: {
    zIndex: 2,
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
    zIndex: 3,
  },
  mapInfoPanel: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: color.surface + "ee",
    borderWidth: 1,
    borderColor: color.borderAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 5,
  },
  mapInfoPanelBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 28,
    backgroundColor: color.surface + "ee",
    borderWidth: 1,
    borderColor: color.borderAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 5,
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
  detailPopup: {
    position: "absolute",
    width: 200,
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 12,
    shadowColor: color.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: color.borderAlt,
    alignItems: "center",
    zIndex: 10,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: color.accentIndigo,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 11,
    color: color.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  detailTriangle: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: color.surface,
  },
});
