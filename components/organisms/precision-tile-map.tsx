import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions, StyleProp, ViewStyle, Pressable } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";

export const TILE_SIZE = 256;
export const MAX_TILE_LAT = 85.05112878;

export type TrailPoint = {
  id: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  municipality: string | null;
  prefecture: string | null;
  recordedAt: Date | string;
};

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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function latLngToWorldPixel(lat: number, lng: number, zoom: number): Pixel {
  const clampedLat = clamp(lat, -MAX_TILE_LAT, MAX_TILE_LAT);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

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

export function formatPlace(point: Pick<TrailPoint, "prefecture" | "municipality">): string {
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
}

export function PrecisionTileMap({
  locations,
  width: propWidth,
  height: propHeight,
  zoom = 18,
  showInfoPanel = true,
  containerStyle,
  customCenter,
}: PrecisionTileMapProps) {
  const { width: windowWidth } = useWindowDimensions();
  const mapWidth = propWidth ?? Math.max(320, Math.min(windowWidth - 32, 980));
  const mapHeight = propHeight ?? (windowWidth < 640 ? 430 : 560);
  const [showDetails, setShowDetails] = useState(false);
  
  const latest = locations[0];
  const center = customCenter ?? latest ?? { lat: 35.681236, lng: 139.767125 };

  const { tiles, topLeft } = useMemo(
    () => getVisibleTiles(center, mapWidth, mapHeight, zoom),
    [center.lat, center.lng, mapHeight, mapWidth, zoom]
  );

  const projected = useMemo(
    () =>
      locations.slice(0, 80).map((point, index) => ({
        point,
        index,
        pixel: projectPoint(point, topLeft, zoom),
      })),
    [locations, topLeft, zoom]
  );

  const visiblePoints = projected.filter(
    ({ pixel }) =>
      pixel.x >= -24 &&
      pixel.x <= mapWidth + 24 &&
      pixel.y >= -24 &&
      pixel.y <= mapHeight + 24
  );
  
  const latestPosition = projected[0]?.pixel ?? { x: mapWidth / 2, y: mapHeight / 2 };
  
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
            onPress={() => setShowDetails(!showDetails)}
            style={[
              styles.latestMarker,
              {
                left: latestPosition.x - 22,
                top: latestPosition.y - 22,
              },
            ]}
          >
            <MaterialIcons name="my-location" size={24} color={color.textWhite} />
          </Pressable>
        </>
      )}

      {showInfoPanel && latest && (
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
      )}

      <View style={styles.zoomBadge}>
        <MaterialIcons name="layers" size={16} color={color.textWhite} />
        <Text style={styles.zoomBadgeText}>z{zoom}</Text>
      </View>

      <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
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
