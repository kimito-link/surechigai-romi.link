/**
 * 軌跡マップ画面
 * 君斗りんくのすれ違ひ通信 MVP
 *
 * Web: 保存済みの正確な lat/lng/accuracyM を OpenStreetMap タイル上に表示する。
 * Native: 地図SDK導入まではプレースホルダ表示。
 */

import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { WebTrailMap } from "@/components/organisms/web-trail-map";
import { LoginPreviewBanner } from "@/components/molecules/login-preview-banner";
import { useTabBarInset } from "@/hooks/use-tab-bar-inset";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";
import { useRouter } from "expo-router";

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

  if (!isAuthReady) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader
          title="軌跡"
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu
          leftElement={
            <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
              <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
            </Pressable>
          }
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
        leftElement={
          <Pressable onPress={() => router.push("/(tabs)")} style={{ padding: 4 }}>
            <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
      />

      {Platform.OS !== "web" ? (
        <NativePlaceholder />
      ) : (
        <WebTrailMap
          visited={visited}
          locations={locations}
          isFetching={isFetchingAreas || isFetchingTrail}
          onRefresh={onRefresh}
          userImageUrl={user?.profileImage ?? undefined}
          contentPaddingBottom={tabInset}
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
  bannerWrap: {
    width: "100%",
    maxWidth: 980,
  },
});
