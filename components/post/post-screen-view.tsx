/**
 * post-authenticated-screen.tsx から切り出した見た目(JSX)専用コンポーネント。
 * 状態機械・useEffectの順序・見た目は一切変えていない
 * (refactor-instructions.md Phase 7 Debt #11)。
 * renderRadarStage/renderSisterBanners のJSX組み立てロジックもここに含める。
 */
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Suspense, lazy, type RefObject, type ReactNode } from "react";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { TabHeaderSpacer } from "@/components/organisms/tab-header-spacer";
import MaterialIcons from "@/lib/icons/material-icons";
import { color } from "@/theme/tokens";
import { HomeStatusLine } from "@/components/post/home-status-line";
import { EnvelopeRail } from "@/components/post/envelope-rail";
import { RadarStageBoundary } from "@/components/post/radar-stage-boundary";
import {
  LazyEnvelopePulse,
  LazyCharacterHere,
  LazyEncounterOpenModal,
} from "@/lib/lazy-heavy-components";
import appConfig from "@/app.config.json";
import { latLngToRadarPercent } from "@/lib/japan-radar-position";
import { CheckinCtaButton } from "@/components/molecules/checkin-cta-button";
import { type EncounterItem } from "@/lib/post/encounter-shared";
import { ReportModal } from "@/components/post/report-modal";
import { styles } from "@/components/post/post-screen-styles";
import type { useMySignal } from "@/hooks/use-my-signal";

const JapanRadarMap = lazy(() =>
  import("@/components/organisms/japan-radar-map").then((m) => ({ default: m.JapanRadarMap })),
);
const RadarHud = lazy(() =>
  import("@/components/organisms/radar-hud").then((m) => ({ default: m.RadarHud })),
);

function DeferredRadarFallback({ style }: { style?: object }) {
  return (
    <View style={[{ minHeight: 120, alignItems: "center", justifyContent: "center" }, style]}>
      <ActivityIndicator color={color.accentPrimary} />
    </View>
  );
}

function LiteRadarPlaceholder({ style }: { style?: object }) {
  return (
    <View style={[{ backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ color: color.textMuted, fontSize: 12 }}>軽量表示中（地図オフ）</Text>
    </View>
  );
}

export type PostScreenViewProps = {
  isDesktop: boolean;
  isAuthenticated: boolean;
  postContext: { element: ReactNode; hasBar: boolean };
  scrollRef: RefObject<ScrollView | null>;
  tabInset: number;
  mapMobileHeight: number;
  liteMode: boolean;
  radarStageReady: boolean;
  focused: boolean;
  envelopeMarkers: EncounterItem[];
  presenceMarkers: {
    userId: number;
    lat: number;
    lng: number;
    profileImage?: string | null;
    name?: string | null;
    place?: string | null;
    isSelf: boolean;
  }[];
  hiddenEnvelopeCount: number;
  hiddenPresenceCount: number;
  handleOpen: (item: EncounterItem) => void;
  animateEnvelopeN: number;
  animatePresenceN: number;
  mySignal: ReturnType<typeof useMySignal>["data"];
  isPausing: boolean;
  pausedUntilLabel: string | null;
  unopened: EncounterItem[];
  emptyOverlay: ReactNode;
  signalGrid: ReactNode;
  showCheckinCta: boolean;
  openModalVisible: boolean;
  openItem: EncounterItem | null;
  setOpenModalVisible: (value: boolean) => void;
  refetch: () => void;
  handleSendStamp: (encounterId: number, emoji: string) => void;
  handleBlock: (userId: number) => void;
  handleReport: (item: EncounterItem) => void;
  reportItem: EncounterItem | null;
  reportModalVisible: boolean;
  setReportModalVisible: (value: boolean) => void;
  handleReportSubmit: (targetUserId: number, encounterId: number, reason: string) => void;
};

export function PostScreenView(props: PostScreenViewProps) {
  const {
    isDesktop,
    isAuthenticated,
    postContext,
    scrollRef,
    tabInset,
    mapMobileHeight,
    liteMode,
    radarStageReady,
    focused,
    envelopeMarkers,
    presenceMarkers,
    hiddenEnvelopeCount,
    hiddenPresenceCount,
    handleOpen,
    animateEnvelopeN,
    animatePresenceN,
    mySignal,
    isPausing,
    pausedUntilLabel,
    unopened,
    emptyOverlay,
    signalGrid,
    showCheckinCta,
    openModalVisible,
    openItem,
    setOpenModalVisible,
    refetch,
    handleSendStamp,
    handleBlock,
    handleReport,
    reportItem,
    reportModalVisible,
    setReportModalVisible,
    handleReportSubmit,
  } = props;

  const renderRadarStage = (stageStyle?: object) => {
    if (liteMode) return <LiteRadarPlaceholder style={stageStyle} />;
    if (!radarStageReady) return <DeferredRadarFallback style={stageStyle} />;

    return (
      <RadarStageBoundary style={stageStyle}>
        <Suspense fallback={<DeferredRadarFallback style={stageStyle} />}>
          <JapanRadarMap active={focused}>
            {envelopeMarkers.map((item, index) => {
              const randomX = 10 + (Math.sin(item.id * 123) * 0.5 + 0.5) * 80;
              const randomY = 10 + (Math.cos(item.id * 321) * 0.5 + 0.5) * 80;
              return (
                <LazyEnvelopePulse
                  key={item.id}
                  x={randomX}
                  y={randomY}
                  onPress={() => handleOpen(item)}
                  animate={focused && index < animateEnvelopeN}
                />
              );
            })}
            {presenceMarkers.map((marker, index) => {
              const pos = latLngToRadarPercent(marker.lat, marker.lng);
              if (!pos) return null;
              const shouldAnimate = focused && (marker.isSelf || index < animatePresenceN);
              return (
                <LazyCharacterHere
                  key={`live-${marker.userId}`}
                  imageUrl={marker.profileImage}
                  name={marker.name ?? "ユーザー"}
                  place={marker.place ?? undefined}
                  x={pos.x}
                  y={pos.y}
                  delay={index * 120}
                  isSelf={marker.isSelf}
                  animate={shouldAnimate}
                />
              );
            })}
            {(hiddenEnvelopeCount > 0 || hiddenPresenceCount > 0) ? (
              <View style={styles.radarOverflowChip} pointerEvents="none">
                {hiddenEnvelopeCount > 0 ? (
                  <Text style={styles.radarOverflowText}>＋他{hiddenEnvelopeCount}通のシグナル</Text>
                ) : null}
                {hiddenPresenceCount > 0 ? (
                  <Text style={styles.radarOverflowText}>＋他{hiddenPresenceCount}人がどこかにいる</Text>
                ) : null}
              </View>
            ) : null}
          </JapanRadarMap>
        </Suspense>
      </RadarStageBoundary>
    );
  };

  const renderSisterBanners = (inFlow = false) =>
    (appConfig.siblingServices ?? []).map((svc) => (
      <Pressable
        key={svc.url}
        onPress={() => Linking.openURL(svc.url)}
        style={({ pressed }) => [
          inFlow ? styles.sisterBannerFlow : styles.sisterBanner,
          pressed && { opacity: 0.75 },
        ]}
      >
        <MaterialIcons name="hub" size={16} color={color.accentPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sisterBannerLabel}>SISTER_SERVICE</Text>
          <Text style={styles.sisterBannerName} numberOfLines={1}>{svc.name}</Text>
        </View>
        <MaterialIcons name="open-in-new" size={14} color={color.textMuted} />
      </Pressable>
    ));

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={[]}>
      <AppHeader variant="full" contextBar={postContext.element} />
      <TabHeaderSpacer variant="full" hasContextBar={postContext.hasBar} />

      {isDesktop ? (
      <View style={styles.desktopSplit}>
        <View style={styles.desktopMapColumn}>
          {renderRadarStage(StyleSheet.absoluteFillObject)}
          {/* デスクトップは右ペインのSignalAccountGridが空状態を主に担うため、
              地図上のemptyOverlayは重複回避で出さない(未認証時は従来どおり出す)。 */}
          {!isAuthenticated && emptyOverlay}
          {renderSisterBanners()}
          {!isAuthenticated && (
            <Suspense fallback={null}>
              <RadarHud isAuthenticated={false} />
            </Suspense>
          )}
        </View>
        {isAuthenticated ? (
          <ScrollView style={styles.desktopRightPane} showsVerticalScrollIndicator={false}>
            {mySignal ? (
              <HomeStatusLine
                checkedInToday={mySignal.checkedInToday}
                latestPlaceLabel={mySignal.latestPlaceLabel}
                latestRecordedAt={mySignal.latestRecordedAt}
                accuracyM={mySignal.latestLocation?.accuracyM}
                isPausing={isPausing}
                pausedUntilLabel={pausedUntilLabel}
              />
            ) : null}
            {unopened.length > 0 ? (
              <EnvelopeRail items={unopened} onOpen={handleOpen} />
            ) : null}
            {emptyOverlay}
            {signalGrid}
          </ScrollView>
        ) : null}
      </View>
      ) : (
      <ScrollView
        ref={scrollRef}
        style={styles.mobileScroll}
        contentContainerStyle={[styles.mobileScrollContent, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
      >
        {isAuthenticated && mySignal ? (
          <HomeStatusLine
            checkedInToday={mySignal.checkedInToday}
            latestPlaceLabel={mySignal.latestPlaceLabel}
            latestRecordedAt={mySignal.latestRecordedAt}
            accuracyM={mySignal.latestLocation?.accuracyM}
            isPausing={isPausing}
            pausedUntilLabel={pausedUntilLabel}
          />
        ) : null}
        {isAuthenticated && unopened.length > 0 ? (
          <EnvelopeRail items={unopened} onOpen={handleOpen} />
        ) : null}
        <View style={[styles.mapHeroMobile, { height: mapMobileHeight }]}>
          {renderRadarStage({ flex: 1 })}
          {emptyOverlay}
          {!isAuthenticated && (
          <Suspense fallback={null}>
            <RadarHud isAuthenticated={false} />
          </Suspense>
        )}
        </View>
        {signalGrid}
        {showCheckinCta && !isDesktop ? (
          <View style={styles.checkinCtaDock}>
            <CheckinCtaButton label="足あとを残す — チェックイン" />
          </View>
        ) : null}
        <View style={styles.mobileFooter}>{renderSisterBanners(true)}</View>
      </ScrollView>
      )}

    {/* 開封モーダル（reanimated chunk — 開封時のみ load） */}
    {openModalVisible && openItem ? (
      <LazyEncounterOpenModal
        item={openItem}
        visible={openModalVisible}
        onClose={() => {
          setOpenModalVisible(false);
          refetch();
        }}
        onSendStamp={handleSendStamp}
        onBlock={handleBlock}
        onReport={handleReport}
      />
    ) : null}

    {/* 通報モーダル */}
    <ReportModal
      item={reportItem}
      visible={reportModalVisible}
      onClose={() => setReportModalVisible(false)}
      onBlock={handleBlock}
      onReport={handleReportSubmit}
    />
  </ScreenContainer>
  );
}
