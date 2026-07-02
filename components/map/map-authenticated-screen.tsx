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
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { LazyWebTrailMap } from "@/lib/lazy-heavy-components";
import { InlineLoginPrompt } from "@/components/molecules/inline-login-prompt";
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
    isLoading: isLoadingAreas,
  } = trpc.zukan.myAreas.useQuery(undefined, {
    enabled: isAuthenticated,
    ...AUTHENTICATED_QUERY_OPTIONS,
  });
  const {
    data: trailData,
    refetch: refetchTrail,
    isFetching: isFetchingTrail,
    isLoading: isLoadingTrail,
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

  const encounterCount = areasData?.encounterPartnerCount ?? 0;
  const hasTrailData = areasData != null || trailData != null;
  const isLoading = (isLoadingAreas || isLoadingTrail) && !hasTrailData;

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <TabScreenHeader
          title="軌跡"
          contextKey="map"
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
      <TabScreenHeader
        title="軌跡"
        contextKey="map"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu
      />

      <LazyWebTrailMap
        visited={visited}
        locations={locations}
        municipalityCount={municipalityCount}
        encounterCount={encounterCount}
        isLoading={isLoading}
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
              <InlineLoginPrompt
                headline="移動の軌跡を、地図に刻めます"
                returnTo="/map"
                benefits={[
                  { icon: "timeline", label: "軌跡" },
                  { icon: "navigation", label: "ここへ向かう" },
                  { icon: "place", label: "聖地巡礼" },
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
