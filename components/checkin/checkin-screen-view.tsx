/**
 * checkin-authenticated-screen.tsx から切り出した見た目(JSX)専用コンポーネント。
 * 状態機械・useEffectの順序・見た目は一切変えていない
 * (refactor-instructions.md Phase 7 Debt #11の続き)。
 * 呼び出し側(CheckinAuthenticatedScreen)が持つ状態・ハンドラーを
 * そのままpropsとして受け取り、830-1066行にあったJSXをそのまま配置する。
 */
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import MaterialIcons from "@/lib/icons/material-icons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { TabScreenHeader } from "@/components/organisms/tab-screen-header";
import { color, palette, contentMaxWidth, WEB_TAB_BAR_HEIGHT } from "@/theme/tokens";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { formatDateTime } from "@/components/organisms/precision-tile-map";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { SponsorCard, type SponsorCardData } from "@/components/molecules/sponsor-card";
import { CheckinPreviewCard } from "@/components/checkin/checkin-preview-card";
import { CheckinSuccessPanel } from "@/components/checkin/checkin-success-panel";
import { navigate } from "@/lib/navigation";
import { PostLoginLocationIntro } from "@/features/onboarding/components/PostLoginLocationIntro";
import type { AuthUser } from "@/lib/auth-context";

type CheckinState = "idle" | "loading" | "adjust" | "success" | "error" | "zero";

export type CheckinScreenViewProps = {
  isDesktop: boolean;
  isMobile: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  state: CheckinState;
  isMapFirst: boolean;
  mapPoint: TrailPoint | null;
  fixedMapCenter: { lat: number; lng: number } | null;
  checkinAccuracyM: number | null;
  checkinLocationId: number | null;
  placeLine: string | null;
  newCount: number;
  errorMsg: string;
  windowWidth: number;
  bottomScrollInset: number;
  locatingBannerText: string;
  mapHeroHeight: number;
  tabInset: number;
  mobileWebChrome: number;
  isPausing: boolean;
  isRetryCoolingDown: boolean;
  isCheckinComplete: boolean;
  mapInteractive: boolean;
  adjustAccuracyHint: string | null;
  sponsorCard: SponsorCardData | null;
  showLocationIntro: boolean;
  pausedBanner: ReactNode;
  settingsBlock: ReactNode;
  mapStyle: AnimatedStyle<ViewStyle>;
  pulseStyle: AnimatedStyle<ViewStyle>;
  buttonStyle: AnimatedStyle<ViewStyle>;
  getButtonColor: () => string;
  getButtonLabel: () => string;
  getButtonIcon: () => string;
  handleMapPinAdjust: (coords: { lat: number; lng: number }) => void;
  handleRetryLocation: () => void;
  handleCheckin: () => void;
  handleShareLocation: () => void;
  handleSponsorPress: (card: SponsorCardData) => void;
  handleLocationIntroAllow: () => void;
  handleLocationIntroLater: () => void;
  isSharing: boolean;
};

export function CheckinScreenView(props: CheckinScreenViewProps) {
  const {
    isDesktop,
    isMobile,
    isAuthenticated,
    user,
    state,
    isMapFirst,
    mapPoint,
    fixedMapCenter,
    checkinAccuracyM,
    checkinLocationId,
    placeLine,
    newCount,
    errorMsg,
    windowWidth,
    bottomScrollInset,
    locatingBannerText,
    mapHeroHeight,
    tabInset,
    mobileWebChrome,
    isPausing,
    isRetryCoolingDown,
    isCheckinComplete,
    mapInteractive,
    adjustAccuracyHint,
    sponsorCard,
    showLocationIntro,
    pausedBanner,
    settingsBlock,
    mapStyle,
    pulseStyle,
    buttonStyle,
    getButtonColor,
    getButtonLabel,
    getButtonIcon,
    handleMapPinAdjust,
    handleRetryLocation,
    handleCheckin,
    handleShareLocation,
    handleSponsorPress,
    handleLocationIntroAllow,
    handleLocationIntroLater,
    isSharing,
  } = props;

  return (
    <ScreenContainer containerClassName="bg-background" style={isMapFirst ? styles.screenFlex : undefined}>
      <TabScreenHeader
        title="チェックイン"
        contextKey="checkin"
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
        showLoginButton={!isAuthenticated}
      />

      {isMapFirst && mapPoint ? (
        /* チェックイン後: 地図 + スクロール詳細 + 下部固定シェア（主役=Xシェア） */
        <View style={styles.mapFirstRoot}>
          {pausedBanner}

          <ScrollView
            style={styles.bottomSheetScroll}
            contentContainerStyle={[
              styles.bottomSheetContent,
              { paddingBottom: bottomScrollInset },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {state === "loading" ? (
              <View style={styles.encounterBanner} testID="checkin-locating-banner">
                <Text style={styles.encounterBannerText}>{locatingBannerText}</Text>
              </View>
            ) : null}

            {state === "loading" && mapPoint ? (
              <Animated.View style={[styles.mapContainer, mapStyle]}>
                <MapErrorBoundary mapType="heatmap" height={mapHeroHeight}>
                  <LazyPrecisionTileMap
                    locations={[mapPoint]}
                    customCenter={fixedMapCenter ?? { lat: mapPoint.lat, lng: mapPoint.lng }}
                    zoom={17}
                    showInfoPanel={false}
                    height={mapHeroHeight}
                    width={Math.min(windowWidth - 32, contentMaxWidth.standard)}
                    markerSize={28}
                    containerStyle={styles.mapInner}
                    userImageUrl={user?.profileImage ?? undefined}
                  />
                </MapErrorBoundary>
              </Animated.View>
            ) : null}

            {state === "adjust" && mapPoint ? (
              <CheckinPreviewCard
                mapPoint={mapPoint}
                mapCenter={fixedMapCenter ?? { lat: mapPoint.lat, lng: mapPoint.lng }}
                mapHeight={mapHeroHeight}
                mapWidth={Math.min(windowWidth - 32, contentMaxWidth.standard)}
                accuracyM={checkinAccuracyM}
                placeLabel={placeLine}
                userImageUrl={user?.profileImage ?? undefined}
                isRetrying={false}
                interactive={mapInteractive}
                onCoordinateSelect={handleMapPinAdjust}
                onRetry={handleRetryLocation}
                onSave={handleCheckin}
              />
            ) : null}

            {(state === "success" || state === "zero") && mapPoint ? (
              <CheckinSuccessPanel
                mapPoint={mapPoint}
                mapCenter={fixedMapCenter ?? { lat: mapPoint.lat, lng: mapPoint.lng }}
                mapHeight={mapHeroHeight}
                mapWidth={Math.min(windowWidth - 32, contentMaxWidth.standard)}
                accuracyM={checkinAccuracyM}
                placeLabel={placeLine}
                recordedAtLabel={formatDateTime(mapPoint.recordedAt)}
                newEncounterCount={state === "success" ? newCount : 0}
                userImageUrl={user?.profileImage ?? undefined}
                onViewMap={() =>
                  navigate.toMapTab(
                    checkinLocationId != null
                      ? { focus: String(checkinLocationId) }
                      : undefined,
                  )
                }
                onShare={handleShareLocation}
                isSharing={isSharing}
              />
            ) : null}

            {state === "success" || state === "zero" ? (
              <View style={styles.bottomSheet}>
                <Text style={styles.privacyNote}>
                  正確な場所を保存します。プライバシーが気になる方は移動専用アカウントの利用をおすすめします。
                </Text>

                <Pressable
                  onPress={handleCheckin}
                  disabled={isPausing}
                  style={({ pressed }) => [
                    styles.recheckButton,
                    isPausing && { opacity: 0.55 },
                    pressed && !isPausing && { opacity: 0.85 },
                  ]}
                >
                  <MaterialIcons name="refresh" size={18} color={color.accentIndigo} />
                  <Text style={styles.recheckButtonText}>もう一度チェックイン</Text>
                </Pressable>

                {settingsBlock}
              </View>
            ) : null}

            {isCheckinComplete && sponsorCard ? (
              <SponsorCard
                card={sponsorCard}
                onPress={handleSponsorPress}
                testID="checkin-sponsor-card"
              />
            ) : null}

            {state === "adjust" ? (
              <View style={styles.bottomSheet}>
                {adjustAccuracyHint ? (
                  <Text style={styles.accuracyHint}>{adjustAccuracyHint}</Text>
                ) : null}
                {settingsBlock}
              </View>
            ) : null}
          </ScrollView>

          {/* success/zero は成功パネル内の「地図で見る/Xでシェア」が出口を担うため、
              測位・確認中（loading/adjust）だけ下部固定ドックでシェア導線を待機表示する。
              Web モバイルでは Tabs の固定タブバー（position:fixed, zIndex:100）と
              このドック（position:absolute, zIndex:20）が別レイヤーで両方 bottom を
              主張するため、ドックの View 自体をタブバーの実高さぶん持ち上げて
              隙間なく重ねる（2026-07-05: スクロール/スワイプ中に帯が二段に見える不具合の修正）。 */}
          {state === "loading" || state === "adjust" ? (
            <View
              style={[
                styles.stickyShareDock,
                Platform.OS === "web" && isMobile
                  ? { bottom: WEB_TAB_BAR_HEIGHT, paddingBottom: 10 }
                  : { paddingBottom: tabInset + mobileWebChrome },
              ]}
            >
              <Pressable
                disabled
                style={[styles.shareButton, styles.shareButtonSticky, { opacity: 0.5 }]}
                accessibilityLabel="この現在地をXでシェア（記録完了後に押せます）"
              >
                <MaterialIcons name="ios-share" size={20} color={color.textWhite} />
                <Text style={styles.shareButtonText}>この現在地をXでシェア</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        /* チェックイン前: ボタンファースト */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            会いたい君がいる現在地を、正確な足あととして残します
          </Text>

          {pausedBanner}

          <View style={styles.buttonWrap}>
            {state === "loading" && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { borderColor: getButtonColor() + "66" },
                  pulseStyle,
                ]}
              />
            )}

            <Animated.View style={[buttonStyle, styles.primaryButtonAnimated]}>
              <Pressable
                onPress={handleCheckin}
                disabled={state === "loading" || isPausing || isRetryCoolingDown}
                accessibilityRole="button"
                accessibilityLabel={getButtonLabel()}
                testID="checkin-primary-button"
                style={({ pressed }) => [
                  styles.checkinButton,
                  { backgroundColor: isPausing ? color.border : getButtonColor() },
                  pressed && { opacity: 0.85 },
                  (state === "loading" || isPausing || isRetryCoolingDown) && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons
                  name={getButtonIcon() as "check" | "close" | "refresh" | "location-on"}
                  size={22}
                  color={color.textWhite}
                />
                <Text style={styles.checkinButtonText}>{getButtonLabel()}</Text>
              </Pressable>
            </Animated.View>
          </View>

          {state === "error" && (
            <View style={[styles.resultBox, { backgroundColor: color.danger + "22" }]}>
              <Text style={[styles.resultTitle, { color: color.danger }]}>
                エラーが発生しました
              </Text>
              <Text style={styles.resultSubtitle}>{errorMsg}</Text>
            </View>
          )}

          {mapPoint && state === "idle" && (
            <Animated.View style={[styles.mapContainer, mapStyle]}>
              <MapErrorBoundary mapType="heatmap" height={200}>
                <LazyPrecisionTileMap
                  locations={[mapPoint]}
                  zoom={17}
                  showInfoPanel={false}
                  height={200}
                  markerSize={28}
                  containerStyle={styles.mapInner}
                  userImageUrl={user?.profileImage ?? undefined}
                />
              </MapErrorBoundary>
            </Animated.View>
          )}

          {settingsBlock}
        </ScrollView>
      )}
      <PostLoginLocationIntro
        visible={showLocationIntro}
        onAllow={handleLocationIntroAllow}
        onLater={handleLocationIntroLater}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenFlex: {
    flex: 1,
  },
  mapFirstRoot: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  stickyShareDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: "center",
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 20,
  },
  encounterBanner: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: color.accentIndigo + "18",
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
    alignItems: "center",
  },
  encounterBannerText: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  bottomSheetScroll: {
    flex: 1,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
  },
  mapContainer: {
    width: "100%",
    alignItems: "center",
  },
  mapInner: {
    borderRadius: 16,
    overflow: "hidden",
  },
  bottomSheet: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    marginTop: 12,
  },
  privacyNote: {
    fontSize: 12,
    color: color.textMuted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  recheckButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.accentIndigo,
    marginBottom: 12,
  },
  recheckButtonText: {
    color: color.accentIndigo,
    fontWeight: "700",
    fontSize: 14,
  },
  accuracyHint: {
    fontSize: 12,
    color: color.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: color.accentPrimary,
    width: "100%",
    maxWidth: contentMaxWidth.standard,
  },
  shareButtonSticky: {
    marginTop: 0,
  },
  shareButtonText: {
    color: color.textWhite,
    fontWeight: "700",
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    color: color.textMuted,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  primaryButtonAnimated: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  checkinButtonText: {
    color: color.textWhite,
    fontWeight: "800",
    fontSize: 16,
  },
  resultBox: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: color.textMuted,
  },
});
