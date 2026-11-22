/**
 * みんなの居場所の地図。
 *
 * PrecisionTileMap と同じく地図ライブラリを使わず OSM タイルを並べて描く。
 * - 見ている人の現在地（青い点）と、選んだ範囲の点線の円（徒歩5分など）
 * - 居場所を出している人のアイコンを正確な座標に置く（ぼかさない）
 * - ピンを押すと、その人を選ぶ（右のリストと連動）
 */
import { useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Platform, type LayoutChangeEvent } from "react-native";
import Svg, { Circle } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";
import { clamp, fitCenterZoom } from "@/lib/map/tile-geo";
import { getVisibleTiles, metersPerPixelAtLat, projectPoint } from "@/components/organisms/precision-tile-map";

type LatLng = { lat: number; lng: number };

export type NearbyMapPerson = LatLng & {
  userId: number;
  name: string | null;
  profileImage: string | null;
};

type Props = {
  /** 見ている人の現在地。無いときは人の分布に合わせて表示する */
  origin: LatLng | null;
  /** 点線の円の半径(m)。null なら円を出さず、全員が入るように表示する */
  rangeMeters: number | null;
  rangeLabel: string;
  people: NearbyMapPerson[];
  selectedId: number | null;
  onSelect: (userId: number | null) => void;
  /** 現在地の取得状態（左上のバッジ） */
  locating: boolean;
};

const AVATAR = 40;
const MAX_ZOOM = 18;

/** 半径 r(m) の円が、地図の短辺の 38% 程度に収まるズーム（タイルは整数ズームのみ） */
function zoomForRadius(lat: number, meters: number, minSide: number): number {
  const targetPx = Math.max(minSide * 0.38, 40);
  const metersPerPx = meters / targetPx;
  const z = Math.log2((156543.03392 * Math.cos((lat * Math.PI) / 180)) / metersPerPx);
  return clamp(Math.floor(z), 3, MAX_ZOOM);
}

export function NearbyPresenceMap({
  origin,
  rangeMeters,
  rangeLabel,
  people,
  selectedId,
  onSelect,
  locating,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) setSize({ w: width, h: height });
  };

  const selected = people.find((p) => p.userId === selectedId) ?? null;

  const view = useMemo(() => {
    if (size.w === 0 || size.h === 0) return null;
    const minSide = Math.min(size.w, size.h);
    let center: LatLng;
    let zoom: number;
    if (origin && rangeMeters != null) {
      center = origin;
      zoom = zoomForRadius(origin.lat, rangeMeters, minSide);
    } else {
      const pts = [...(origin ? [origin] : []), ...people];
      const fit = fitCenterZoom(pts, size.w, size.h);
      center = fit.center;
      zoom = pts.length === 1 ? 16 : clamp(fit.zoom, 3, MAX_ZOOM);
    }
    // 選んだ人が画面の外なら、その人を中心にする（ズームはそのまま）
    if (selected) {
      const { topLeft } = getVisibleTiles(center, size.w, size.h, zoom);
      const p = projectPoint(selected, topLeft, zoom);
      if (p.x < AVATAR || p.y < AVATAR || p.x > size.w - AVATAR || p.y > size.h - AVATAR) {
        center = { lat: selected.lat, lng: selected.lng };
      }
    }
    const { tiles, topLeft } = getVisibleTiles(center, size.w, size.h, zoom);
    return { center, zoom, tiles, topLeft };
  }, [size.w, size.h, origin, rangeMeters, people, selected]);

  const circle = useMemo(() => {
    if (!view || !origin || rangeMeters == null) return null;
    const c = projectPoint(origin, view.topLeft, view.zoom);
    const r = rangeMeters / metersPerPixelAtLat(origin.lat, view.zoom);
    return { cx: c.x, cy: c.y, r };
  }, [view, origin, rangeMeters]);

  const originPx = view && origin ? projectPoint(origin, view.topLeft, view.zoom) : null;

  return (
    <View style={styles.root} onLayout={onLayout} testID="nearby-map">
      {view ? (
        <>
          {view.tiles.map((t) => (
            <Image
              key={`${view.zoom}:${t.key}`}
              source={{ uri: t.url }}
              style={[styles.tile, { left: t.left, top: t.top }]}
              accessibilityIgnoresInvertColors
            />
          ))}

          {circle ? (
            <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Circle
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill={palette.kimitoBlue}
                fillOpacity={0.1}
                stroke={palette.kimitoBlue}
                strokeWidth={3}
                strokeDasharray="10 8"
              />
            </Svg>
          ) : null}

          {/* 背景を押したら選択を外す */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => onSelect(null)} accessible={false} />

          {originPx ? (
            <View
              pointerEvents="none"
              style={[styles.originWrap, { left: originPx.x - 40, top: originPx.y - 9 }]}
            >
              <View style={styles.originDot} />
              <Text style={styles.originLabel}>現在地</Text>
            </View>
          ) : null}

          {people.map((p) => {
            const px = projectPoint(p, view.topLeft, view.zoom);
            if (px.x < -AVATAR || px.y < -AVATAR || px.x > size.w + AVATAR || px.y > size.h + AVATAR) return null;
            const isSel = p.userId === selectedId;
            const name = p.name ?? "ユーザー";
            return (
              <Pressable
                key={p.userId}
                onPress={() => onSelect(isSel ? null : p.userId)}
                accessibilityRole="button"
                accessibilityLabel={`${name} さんの居場所`}
                hitSlop={6}
                style={[
                  styles.pin,
                  { left: px.x - AVATAR / 2, top: px.y - AVATAR - 8, zIndex: isSel ? 20 : 10 },
                ]}
              >
                <View style={[styles.avatarRing, isSel && styles.avatarRingSelected]}>
                  {p.profileImage ? (
                    <Image source={{ uri: p.profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>{name.slice(0, 1)}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.pinTail, isSel && styles.pinTailSelected]} />
                {isSel ? (
                  <View style={styles.nameTag}>
                    <Text style={styles.nameTagText} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </>
      ) : null}

      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText}>{locating ? "現在地を取得中…" : origin ? "現在地を使用中" : "現在地なし"}</Text>
      </View>

      {selectedId != null ? (
        <Pressable
          onPress={() => onSelect(null)}
          accessibilityRole="button"
          accessibilityLabel="現在地に戻る"
          style={({ pressed }) => [styles.recenter, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="my-location" size={22} color={palette.kimitoBlue} />
        </Pressable>
      ) : null}

      {circle ? (
        <View style={styles.legend} pointerEvents="none">
          <Text style={styles.legendText}>点線の円 = {rangeLabel}</Text>
        </View>
      ) : null}
      <Text style={styles.attribution} pointerEvents="none">
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: palette.kimitoBlueSoft,
  },
  tile: {
    position: "absolute",
    width: 256,
    height: 256,
  },
  originWrap: {
    position: "absolute",
    width: 80,
    alignItems: "center",
  },
  originDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.blue600,
    borderWidth: 3,
    borderColor: palette.white,
    ...Platform.select({
      web: { boxShadow: "0 0 0 6px rgba(37,99,235,0.25)" } as object,
      default: { shadowColor: palette.blue600, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  originLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: palette.kimitoBlue,
    backgroundColor: palette.white,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  pin: {
    position: "absolute",
    width: AVATAR,
    alignItems: "center",
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    borderColor: palette.kimitoOrange,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  avatarRingSelected: {
    borderColor: palette.kimitoBlue,
    transform: [{ scale: 1.15 }],
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.kimitoBlueSoft,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.kimitoBlue,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: palette.kimitoOrange,
  },
  pinTailSelected: {
    borderTopColor: palette.kimitoBlue,
  },
  nameTag: {
    position: "absolute",
    top: AVATAR + 12,
    minWidth: 60,
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: palette.kimitoBlue,
    alignItems: "center",
  },
  nameTagText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.white,
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.white,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.kimitoBlue,
  },
  recenter: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    position: "absolute",
    right: 12,
    bottom: 26,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.white,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.kimitoBlue,
  },
  attribution: {
    position: "absolute",
    right: 4,
    bottom: 4,
    fontSize: 10,
    color: color.textSecondary,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 4,
  },
});
