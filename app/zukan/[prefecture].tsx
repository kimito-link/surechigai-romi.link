import { View, Text, ScrollView, StyleSheet, RefreshControl, Image, Pressable, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useResponsive } from "@/hooks/use-responsive";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import {
  PrecisionTileMap,
  TILE_SIZE,
  clamp,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";

/** 複数の足あとが収まる中心座標とズームを算出（バウンディングボックスにフィット） */
function fitCenterZoom(
  points: { lat: number; lng: number }[],
  mapW: number,
  mapH: number
): { center: { lat: number; lng: number }; zoom: number } {
  if (points.length === 0) {
    return { center: { lat: 36.2048, lng: 138.2529 }, zoom: 5 }; // 日本全体
  }
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  if (points.length === 1) return { center, zoom: 14 };

  const mercY = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI / 180) / 2));
  const worldLng = Math.max((maxLng - minLng) / 360, 1e-6);
  const worldLat = Math.max((mercY(maxLat) - mercY(minLat)) / (2 * Math.PI), 1e-6);
  const zoomLng = Math.log2(mapW / (TILE_SIZE * worldLng));
  const zoomLat = Math.log2(mapH / (TILE_SIZE * worldLat));
  const zoom = Math.floor(Math.min(zoomLng, zoomLat)) - 1; // 余白
  return { center, zoom: clamp(zoom, 5, 16) };
}

export default function PrefectureEncounterScreen() {
  const { prefecture } = useLocalSearchParams<{ prefecture: string }>();
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const prefName = typeof prefecture === "string" ? prefecture : prefecture?.[0] ?? "";

  const { data, isFetching, refetch } = trpc.zukan.encounterUsersByPrefecture.useQuery(
    { prefecture: prefName },
    { enabled: !!prefName }
  );

  // 自分の足あと（この県の分だけ地図に出す）
  const { data: trailData, refetch: refetchTrail } = trpc.zukan.myTrail.useQuery(
    { limit: 500 },
    { enabled: !!prefName }
  );

  const prefLocations: TrailPoint[] = useMemo(
    () => (trailData?.locations ?? []).filter((l) => l.prefecture === prefName),
    [trailData, prefName]
  );

  // この県で歩いた市区町村（重複除去）
  const prefMunicipalities = useMemo(() => {
    const set = new Set<string>();
    for (const l of prefLocations) if (l.municipality) set.add(l.municipality);
    return Array.from(set);
  }, [prefLocations]);

  const mapW = Math.max(320, Math.min(windowWidth - 32, 980));
  const mapH = windowWidth < 640 ? 360 : 460;
  const { center, zoom } = useMemo(
    () => fitCenterZoom(prefLocations, mapW, mapH),
    [prefLocations, mapW, mapH]
  );

  const onRefresh = useCallback(() => {
    refetch();
    refetchTrail();
  }, [refetch, refetchTrail]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)/zukan");
    }
  }, [router]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title={`${prefName} の記録`}
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={false}
        leftElement={
          <Pressable onPress={handleBack} style={{ padding: 4 }}>
            <MaterialIcons name="arrow-back" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={color.accentAlt} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* この県を歩いた足あと（地図） */}
        {prefLocations.length > 0 && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>{prefName} を歩いた足あと</Text>
            <PrecisionTileMap
              locations={prefLocations}
              width={mapW}
              height={mapH}
              customCenter={center}
              zoom={zoom}
              showInfoPanel={false}
            />
            <Text style={styles.mapCaption}>
              {prefLocations.length} 件の正確な足あと（タップで最新地点の座標）
            </Text>

            {prefMunicipalities.length > 0 && (
              <View style={styles.chipsRow}>
                {prefMunicipalities.map((m) => (
                  <View key={m} style={styles.chip}>
                    <MaterialIcons name="place" size={13} color={palette.kimitoBlue} />
                    <Text style={styles.chipText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>{prefName} ですれ違った人</Text>

        {data?.users && data.users.length > 0 ? (
          <View style={styles.list}>
            {data.users.map((u) => (
              <View key={u.partnerId} style={styles.userCard}>
                <Image
                  source={{
                    uri: u.partnerProfileImage || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {u.partnerDisplayName || "名無し"}
                  </Text>
                  {u.partnerUsername && (
                    <Text style={styles.username} numberOfLines={1}>
                      @{u.partnerUsername}
                    </Text>
                  )}
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>すれ違い: {u.encounterCount}回</Text>
                    <Text style={styles.statText}>
                      最終: {new Date(u.lastEncounteredAt).toLocaleDateString("ja-JP")}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            {isFetching ? (
              <Text style={styles.emptyText}>読み込み中...</Text>
            ) : (
              <>
                <MaterialIcons name="person-off" size={48} color={color.textMuted} />
                <Text style={styles.emptyText}>まだこの県ですれ違った人はいません</Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mapCaption: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.surfaceAlt,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  username: {
    fontSize: 13,
    color: color.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  statText: {
    fontSize: 12,
    color: color.textSecondary,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
