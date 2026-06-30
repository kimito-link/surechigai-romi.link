/**
 * 軌跡マップ画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * 保存済みの正確な lat/lng/accuracyM を OpenStreetMap タイル上に表示する。
 * Web / Native 共通（PrecisionTileMap は RN コンポーネント）。
 */

import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useCallback, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { LazyWebTrailMap } from "@/lib/lazy-heavy-components";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { DeleteTrailConfirmModal } from "@/components/molecules/delete-trail-confirm-modal";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { palette, contentMaxWidth } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { AUTHENTICATED_QUERY_OPTIONS } from "@/lib/authenticated-query-options";
import { useTrailLocationActions } from "@/hooks/use-trail-location-actions";

export function MapAuthenticatedScreen() {
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

  const onRefreshData = useCallback(() => {
    void Promise.all([refetchAreas(), refetchTrail()]);
  }, [refetchAreas, refetchTrail]);

  const {
    deletingLocationId,
    updatingLocationId,
    confirmDeleteId,
    handleDeleteLocation,
    handleToggleVisibility,
    executeDelete,
    cancelDelete,
  } = useTrailLocationActions(onRefreshData);

  const onRefresh = useCallback(() => {
    void onRefreshData();
  }, [onRefreshData]);

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

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="軌跡"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
        />
        <View style={styles.authLoading}>
          <ActivityIndicator size="large" color={palette.kimitoBlue} />
        </View>
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
      />

      <LazyWebTrailMap
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
        onToggleVisibility={isAuthenticated ? handleToggleVisibility : undefined}
        deletingLocationId={deletingLocationId}
        updatingLocationId={updatingLocationId}
        historyLimit={30}
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

      {isAuthenticated ? (
        <DeleteTrailConfirmModal
          visible={confirmDeleteId != null}
          onConfirm={executeDelete}
          onCancel={cancelDelete}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  trailMap: {
    flex: 1,
    width: "100%",
  },
  bannerWrap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
  },
});
