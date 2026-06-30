/**
 * 軌跡マップ画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * 保存済みの正確な lat/lng/accuracyM を OpenStreetMap タイル上に表示する。
 * Web / Native 共通（PrecisionTileMap は RN コンポーネント）。
 */

import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useCallback, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { WebTrailMap } from "@/components/organisms/web-trail-map";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { palette } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { AUTHENTICATED_QUERY_OPTIONS } from "@/lib/authenticated-query-options";

export default function MapScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const router = useRouter();
  const tabInset = useTabBarInset();

  const {
    data: areasData,
    refetch: refetchAreas,
    isFetching: isFetchingAreas,
  } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
    ...AUTHENTICATED_QUERY_OPTIONS,
  });
  const {
    data: trailData,
    refetch: refetchTrail,
    isFetching: isFetchingTrail,
  } = trpc.zukan.myTrail.useQuery(
    { limit: 120 },
    {
      enabled: isAuthenticated,
      ...AUTHENTICATED_QUERY_OPTIONS,
    },
  );

  const deleteLocationMutation = trpc.zukan.deleteLocation.useMutation({
    onSuccess: () => {
      void refetchTrail();
    },
    onError: (err) => {
      Alert.alert("エラー", err.message || "足あとの削除に失敗しました");
    },
  });
  const [deletingLocationId, setDeletingLocationId] = useState<number | null>(null);

  const handleDeleteLocation = useCallback(
    (locationId: number) => {
      Alert.alert(
        "足あとを削除",
        "この記録を地図から消します。すれ違いマッチングにも使われなくなります。",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: () => {
              setDeletingLocationId(locationId);
              deleteLocationMutation.mutate(
                { locationId },
                { onSettled: () => setDeletingLocationId(null) },
              );
            },
          },
        ],
      );
    },
    [deleteLocationMutation],
  );

  const onRefresh = useCallback(() => {
    void Promise.all([refetchAreas(), refetchTrail()]);
  }, [refetchAreas, refetchTrail]);

  const visited = areasData?.visited ?? [];
  const locations = trailData?.locations ?? [];

  const municipalityCount = useMemo(() => {
    const names = new Set<string>();
    for (const v of visited) {
      const name = v.municipality || v.prefecture;
      if (name) names.add(`${v.prefecture ?? ""}/${name}`);
    }
    return names.size;
  }, [visited]);

  const encounterCount =
    areasData?.encounterPrefectures?.reduce((s, e) => s + e.encounterCount, 0) ?? 0;

  const headerLeft = (
    <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
      <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
    </Pressable>
  );

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="軌跡"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          leftElement={headerLeft}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader
        title="軌跡"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
        leftElement={headerLeft}
      />

      <WebTrailMap
        visited={visited}
        locations={locations}
        municipalityCount={municipalityCount}
        encounterCount={encounterCount}
        isFetching={isFetchingAreas || isFetchingTrail}
        onRefresh={onRefresh}
        userImageUrl={user?.profileImage ?? undefined}
        contentPaddingBottom={tabInset}
        canDeleteLocations={isAuthenticated}
        onDeleteLocation={isAuthenticated ? handleDeleteLocation : undefined}
        deletingLocationId={deletingLocationId}
        style={styles.trailMap}
        topContent={
          !isAuthenticated ? (
            <View style={styles.bannerWrap}>
              <LoginPreviewBanner
                headline="ログインすると、あなたの足あとが地図に刻まれます"
                benefits={[
                  { icon: "near-me", label: "道路や建物まで辿れる精度で記録" },
                  { icon: "timeline", label: "移動の軌跡をあとから振り返れる" },
                  { icon: "place", label: "思い出の場所にもう一度行ける" },
                ]}
              />
            </View>
          ) : undefined
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  trailMap: {
    flex: 1,
    width: "100%",
  },
  bannerWrap: {
    width: "100%",
    maxWidth: 980,
  },
});
