/**
 * app/visit.tsx から切り出した見た目(JSX)専用コンポーネント。
 * 状態機械・useEffectの順序・見た目は一切変えていない
 * (refactor-instructions.md Phase 7 Debt #11)。
 */
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { HeaderHomeButton } from "@/components/molecules/header-back-button";
import { LazyPrecisionTileMap } from "@/lib/lazy-heavy-components";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { color } from "@/theme/tokens";
import { formatCoordinate } from "@/lib/parse-coordinate-input";
import { styles } from "@/components/visit/visit-screen-styles";
import type { CurrentLocation } from "@/lib/get-current-location";
import type {
  GroupVisitReportItem,
  GroupVisitStats,
} from "@/modules/encounter/db/queries";

export type VisitScreenViewProps = {
  isDesktop: boolean;
  isAuthenticated: boolean;
  isFetching: boolean;
  canReadGroup: boolean;
  onRefresh: () => void;
  groupCode: string;
  setGroupCode: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  placeName: string;
  setPlaceName: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  showCoordInput: boolean;
  setShowCoordInput: (updater: (value: boolean) => boolean) => void;
  coordinateText: string;
  setCoordinateText: (value: string) => void;
  draftPin: CurrentLocation | null;
  draftPinPoints: TrailPoint[];
  handleSetCurrentPin: () => void;
  handleApplyCoordinatePin: () => void;
  handleReport: () => void;
  isReportPending: boolean;
  submitDisabled: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  stats: GroupVisitStats;
  mapPoints: TrailPoint[];
  reports: GroupVisitReportItem[];
  formatDateTime: (value: Date | string | null) => string;
  formatReportPlace: (report: GroupVisitReportItem) => string;
};

export function VisitScreenView(props: VisitScreenViewProps) {
  const {
    isDesktop,
    isAuthenticated,
    isFetching,
    canReadGroup,
    onRefresh,
    groupCode,
    setGroupCode,
    displayName,
    setDisplayName,
    placeName,
    setPlaceName,
    note,
    setNote,
    showCoordInput,
    setShowCoordInput,
    coordinateText,
    setCoordinateText,
    draftPin,
    draftPinPoints,
    handleSetCurrentPin,
    handleApplyCoordinatePin,
    handleReport,
    isReportPending,
    submitDisabled,
    statusMessage,
    errorMessage,
    stats,
    mapPoints,
    reports,
    formatDateTime,
    formatReportPlace,
  } = props;

  return (
    <ScreenContainer
      containerClassName="bg-background"
      style={styles.screen}
      headerProps={{
        title: "訪問申告",
        showCharacters: false,
        isDesktop,
        showLoginButton: !isAuthenticated,
        showMenu: true,
        leftElement: <HeaderHomeButton />,
        variant: "compact",
      }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              if (canReadGroup) onRefresh();
            }}
            tintColor={color.accentPrimary}
          />
        }
      >
        <View style={styles.heroBand}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="groups" size={28} color={color.textWhite} />
          </View>
          <View style={styles.heroTextBlock}>
            <Text style={styles.eyebrow}>GROUP VISIT LOG</Text>
            <Text style={styles.heroTitle}>グループ内の訪問を見える化</Text>
            <Text style={styles.heroCopy}>
              同じコードを知っている人だけが、申告した場所を見られます。
            </Text>
          </View>
        </View>

        <View style={styles.formPanel}>
          <Text style={styles.sectionLabel}>申告設定</Text>
          <View style={styles.inputGrid}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>グループコード</Text>
              <TextInput
                value={groupCode}
                onChangeText={setGroupCode}
                placeholder="例: romi-team"
                placeholderTextColor={color.textHint}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>表示名</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="例: 佐藤"
                placeholderTextColor={color.textHint}
                maxLength={40}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>場所名</Text>
            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="例: 長野駅前 / 会場入口"
              placeholderTextColor={color.textHint}
              maxLength={120}
              style={styles.input}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>メモ</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="任意"
              placeholderTextColor={color.textHint}
              maxLength={140}
              multiline
              style={[styles.input, styles.noteInput]}
            />
          </View>

          <View style={styles.pinPanel}>
            <View style={styles.pinHeader}>
              <View style={styles.pinIcon}>
                <MaterialIcons name="place" size={21} color={color.textWhite} />
              </View>
              <View style={styles.pinHeaderText}>
                <Text style={styles.pinTitle}>申告するピン</Text>
                <Text style={styles.pinSub}>現在地、または座標から場所を決めてください。</Text>
              </View>
            </View>

            <View style={styles.pinActions}>
              {/* 主導線: ワンタップで現在地をピンにする */}
              <Pressable
                onPress={handleSetCurrentPin}
                disabled={isReportPending}
                style={({ pressed }) => [
                  styles.primaryPinButton,
                  isReportPending && styles.secondaryButtonDisabled,
                  pressed && !isReportPending && { opacity: 0.86 },
                ]}
              >
                <MaterialIcons name="my-location" size={20} color={color.textWhite} />
                <Text style={styles.primaryPinButtonText}>現在地をピンにする</Text>
              </Pressable>

              {/* 補助: 座標/URLで指定（折りたたみ） */}
              <Pressable
                onPress={() => setShowCoordInput((v) => !v)}
                style={({ pressed }) => [styles.coordToggle, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons
                  name={showCoordInput ? "expand-less" : "expand-more"}
                  size={18}
                  color={color.textMuted}
                />
                <Text style={styles.coordToggleText}>座標・Google Maps URLで指定</Text>
              </Pressable>

              {showCoordInput && (
                <View style={styles.coordinateGroup}>
                  <TextInput
                    value={coordinateText}
                    onChangeText={setCoordinateText}
                    placeholder="緯度経度 or Google Maps URL"
                    placeholderTextColor={color.textHint}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    style={[styles.input, styles.coordinateInput]}
                  />
                  <Pressable
                    onPress={handleApplyCoordinatePin}
                    disabled={isReportPending}
                    style={({ pressed }) => [
                      styles.coordinateButton,
                      isReportPending && styles.secondaryButtonDisabled,
                      pressed && !isReportPending && { opacity: 0.86 },
                    ]}
                  >
                    <MaterialIcons name="add-location-alt" size={18} color={color.textWhite} />
                    <Text style={styles.coordinateButtonText}>座標からピン</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {draftPin ? (
              <>
                <View style={styles.pinMetaRow}>
                  <MaterialIcons name="check-circle" size={17} color={color.success} />
                  <Text style={styles.pinMetaText} numberOfLines={1}>
                    ピン: {formatCoordinate(draftPin.lat, draftPin.lng)}
                    {draftPin.accuracy ? ` / 精度 ±${Math.round(draftPin.accuracy)}m` : ""}
                  </Text>
                </View>
                <LazyPrecisionTileMap
                  locations={draftPinPoints}
                  zoom={17}
                  height={220}
                  showInfoPanel={false}
                  containerStyle={styles.pinPreviewMap}
                  markerIcon="place"
                />
              </>
            ) : (
              <View style={styles.pinEmptyLine}>
                <MaterialIcons name="location-searching" size={18} color={color.textMuted} />
                <Text style={styles.pinEmptyText}>ピンをセットすると、申告前に地図で確認できます。</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleReport}
            disabled={submitDisabled}
            style={({ pressed }) => [
              styles.reportButton,
              submitDisabled && styles.reportButtonDisabled,
              pressed && !submitDisabled && { opacity: 0.86, transform: [{ scale: 0.99 }] },
            ]}
          >
            <MaterialIcons
              name={isReportPending ? "hourglass-top" : "place"}
              size={20}
              color={color.textWhite}
            />
            <Text style={styles.reportButtonText}>
              {isReportPending ? "申告中..." : "このピンで申告"}
            </Text>
          </Pressable>

          {statusMessage ? (
            <View style={styles.statusBar}>
              <MaterialIcons name="check-circle" size={18} color={color.success} />
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={[styles.statusBar, styles.errorBar]}>
              <MaterialIcons name="error" size={18} color={color.danger} />
              <Text style={[styles.statusText, styles.errorText]}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.totalReports}</Text>
            <Text style={styles.summaryLabel}>申告</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.uniqueVisitors}</Text>
            <Text style={styles.summaryLabel}>参加者</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{stats.areaCount}</Text>
            <Text style={styles.summaryLabel}>地点</Text>
          </View>
        </View>

        {canReadGroup && mapPoints.length > 0 ? (
          <View style={styles.mapPanel}>
            <LazyPrecisionTileMap
              locations={mapPoints}
              zoom={16}
              height={isDesktop ? 460 : 340}
              showInfoPanel
              containerStyle={styles.mapFrame}
              markerIcon="place"
            />
          </View>
        ) : (
          <View style={styles.emptyMap}>
            <MaterialIcons name="location-searching" size={38} color={color.textMuted} />
            <Text style={styles.emptyTitle}>
              {canReadGroup ? "まだ申告はありません" : "グループコードを入力"}
            </Text>
            <Text style={styles.emptyText}>
              {canReadGroup
                ? "最初の訪問を申告すると、ここに地図が出ます。"
                : "同じコードを入れたメンバーの申告だけを表示します。"}
            </Text>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>最近の申告</Text>
          <Text style={styles.latestText}>最新 {formatDateTime(stats.latestReportedAt)}</Text>
        </View>

        {reports.slice(0, 40).map((report) => (
          <View key={report.id} style={styles.reportRow}>
            <View style={styles.pinBadge}>
              <MaterialIcons name="place" size={18} color={color.textWhite} />
            </View>
            <View style={styles.reportBody}>
              <View style={styles.reportTopLine}>
                <Text style={styles.reportName} numberOfLines={1}>
                  {report.displayName}
                </Text>
                <Text style={styles.reportTime}>{formatDateTime(report.reportedAt)}</Text>
              </View>
              <Text style={styles.reportPlace} numberOfLines={1}>
                {formatReportPlace(report)}
              </Text>
              {report.note ? (
                <Text style={styles.reportNote} numberOfLines={2}>
                  {report.note}
                </Text>
              ) : null}
              <Text style={styles.reportMeta} numberOfLines={1}>
                {report.accuracyM ? `精度 ±${Math.round(report.accuracyM)}m` : "精度不明"}
                {report.prefecture ? ` / ${report.prefecture}` : ""}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
