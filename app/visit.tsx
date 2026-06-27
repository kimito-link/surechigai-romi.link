/**
 * グループ訪問申告画面。
 * SNS投稿ではなく、共有グループコード内だけで訪問を申告・可視化する。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/organisms/app-header";
import { PrecisionTileMap, type TrailPoint } from "@/components/organisms/precision-tile-map";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useResponsive } from "@/hooks/use-responsive";
import { trpc } from "@/lib/trpc";
import { color, palette } from "@/theme/tokens";

type BrowserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

const GROUP_CODE_STORAGE_KEY = "surechigai.groupVisit.groupCode";
const DISPLAY_NAME_STORAGE_KEY = "surechigai.groupVisit.displayName";
const VISITOR_TOKEN_STORAGE_KEY = "surechigai.groupVisit.visitorToken";

function getWebLocation(): Promise<BrowserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("この端末では位置情報を取得できません"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => reject(new Error("位置情報の許可が必要です")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

async function getNativeLocation(): Promise<BrowserLocation> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Location = (await import("expo-location")) as any;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("位置情報の許可が必要です");
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy?.Balanced ?? 4,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

async function getCurrentLocation(): Promise<BrowserLocation> {
  if (Platform.OS === "web") return getWebLocation();
  return getNativeLocation();
}

function randomToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

function getVisitorToken(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") return randomToken();

  const stored = window.localStorage.getItem(VISITOR_TOKEN_STORAGE_KEY);
  if (stored) return stored;

  const token = randomToken();
  window.localStorage.setItem(VISITOR_TOKEN_STORAGE_KEY, token);
  return token;
}

function formatDateTime(value: Date | string | null): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReportPlace(report: {
  placeName: string | null;
  address: string | null;
  prefecture: string | null;
  municipality: string | null;
}): string {
  if (report.placeName) return report.placeName;
  if (report.address) return report.address;
  const area = [report.prefecture, report.municipality].filter(Boolean).join(" ");
  return area || "申告地点";
}

const COORDINATE_NUMBER_RE = "([+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+))";

function formatPinCoordinate(pin: Pick<BrowserLocation, "lat" | "lng">): string {
  return `${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`;
}

function parseCoordinateMatch(match: RegExpMatchArray | null): BrowserLocation | null {
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function safeDecodeInput(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function parseCoordinateInput(input: string): BrowserLocation | null {
  const source = safeDecodeInput(input.trim()).replace(/\+/g, " ");
  if (!source) return null;

  const coordinatePair = `${COORDINATE_NUMBER_RE}\\s*,\\s*${COORDINATE_NUMBER_RE}`;
  const fromAtMarker = parseCoordinateMatch(source.match(new RegExp(`@${coordinatePair}`)));
  if (fromAtMarker) return fromAtMarker;

  const fromQuery = parseCoordinateMatch(source.match(new RegExp(`[?&](?:q|query|ll)=${coordinatePair}`)));
  if (fromQuery) return fromQuery;

  return parseCoordinateMatch(source.match(new RegExp(coordinatePair)));
}

export default function GroupVisitScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const utils = trpc.useUtils();

  const [groupCode, setGroupCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [draftPin, setDraftPin] = useState<BrowserLocation | null>(null);
  const [coordinateText, setCoordinateText] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    setGroupCode(window.localStorage.getItem(GROUP_CODE_STORAGE_KEY) ?? "");
    setDisplayName(window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? "");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    window.localStorage.setItem(GROUP_CODE_STORAGE_KEY, groupCode);
  }, [groupCode]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName);
  }, [displayName]);

  const trimmedGroupCode = groupCode.trim();
  const canReadGroup = trimmedGroupCode.length >= 2;

  const visitQuery = trpc.visit.list.useQuery(
    { groupCode: trimmedGroupCode, limit: 160 },
    {
      enabled: canReadGroup,
      refetchInterval: 45_000,
    },
  );

  const reportMutation = trpc.visit.report.useMutation({
    onSuccess: async () => {
      await Promise.allSettled([
        visitQuery.refetch(),
        utils.visit.list.invalidate(),
      ]);
    },
  });

  const reports = visitQuery.data?.reports ?? [];
  const stats = visitQuery.data?.stats ?? {
    totalReports: 0,
    uniqueVisitors: 0,
    areaCount: 0,
    latestReportedAt: null,
  };

  const mapPoints: TrailPoint[] = useMemo(
    () =>
      reports.map((report) => ({
        id: report.id,
        lat: report.lat,
        lng: report.lng,
        accuracyM: report.accuracyM,
        municipality: report.municipality,
        prefecture: report.prefecture,
        address: formatReportPlace(report),
        recordedAt: report.reportedAt,
      })),
    [reports],
  );

  const draftPinPoints: TrailPoint[] = useMemo(
    () =>
      draftPin
        ? [
            {
              id: -1,
              lat: draftPin.lat,
              lng: draftPin.lng,
              accuracyM: draftPin.accuracy ?? null,
              municipality: null,
              prefecture: null,
              address: placeName.trim() || "申告するピン",
              recordedAt: new Date().toISOString(),
            },
          ]
        : [],
    [draftPin, placeName],
  );

  const handleSetCurrentPin = useCallback(async () => {
    setStatusMessage(null);
    setErrorMessage(null);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const pos = await getCurrentLocation();
      setDraftPin(pos);
      setCoordinateText(formatPinCoordinate(pos));
      setStatusMessage("現在地にピンを置きました");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "現在地を取得できませんでした");
    }
  }, []);

  const handleApplyCoordinatePin = useCallback(() => {
    setStatusMessage(null);
    setErrorMessage(null);

    const parsed = parseCoordinateInput(coordinateText);
    if (!parsed) {
      setErrorMessage("緯度経度、またはGoogle Maps URLを入力してください");
      return;
    }

    setDraftPin(parsed);
    setCoordinateText(formatPinCoordinate(parsed));
    setStatusMessage("座標からピンを置きました");
  }, [coordinateText]);

  const handleReport = useCallback(async () => {
    setStatusMessage(null);
    setErrorMessage(null);

    const group = groupCode.trim();
    const name = displayName.trim();
    if (group.length < 2) {
      setErrorMessage("グループコードを入力してください");
      return;
    }
    if (!name) {
      setErrorMessage("表示名を入力してください");
      return;
    }
    if (!draftPin) {
      setErrorMessage("申告するピンをセットしてください");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = await reportMutation.mutateAsync({
        groupCode: group,
        displayName: name,
        placeName: placeName.trim() || undefined,
        note: note.trim() || undefined,
        visitorToken: getVisitorToken(),
        lat: draftPin.lat,
        lng: draftPin.lng,
        accuracy: draftPin.accuracy,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setPlaceName("");
      setNote("");
      setDraftPin(null);
      setCoordinateText("");
      setStatusMessage(
        `${formatReportPlace(result.report)} に申告しました`,
      );
    } catch (error) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setErrorMessage(error instanceof Error ? error.message : "申告に失敗しました");
    }
  }, [displayName, draftPin, groupCode, note, placeName, reportMutation]);

  const submitDisabled =
    reportMutation.isPending || !groupCode.trim() || !displayName.trim() || !draftPin;

  return (
    <ScreenContainer containerClassName="bg-background" style={styles.screen}>
      <AppHeader
        title="訪問申告"
        showCharacters={false}
        isDesktop={isDesktop}
        showLoginStatus={false}
        showLoginButton={false}
        showMenu
        leftElement={
          <Pressable onPress={() => router.push("/(tabs)")} style={styles.headerHomeButton}>
            <MaterialIcons name="home" size={24} color={palette.kimitoBlue} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={visitQuery.isFetching}
            onRefresh={() => {
              if (canReadGroup) void visitQuery.refetch();
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
              <Pressable
                onPress={handleSetCurrentPin}
                disabled={reportMutation.isPending}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  reportMutation.isPending && styles.secondaryButtonDisabled,
                  pressed && !reportMutation.isPending && { opacity: 0.86 },
                ]}
              >
                <MaterialIcons name="my-location" size={18} color={color.textWhite} />
                <Text style={styles.secondaryButtonText}>現在地をピンにする</Text>
              </Pressable>

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
                  disabled={reportMutation.isPending}
                  style={({ pressed }) => [
                    styles.coordinateButton,
                    reportMutation.isPending && styles.secondaryButtonDisabled,
                    pressed && !reportMutation.isPending && { opacity: 0.86 },
                  ]}
                >
                  <MaterialIcons name="add-location-alt" size={18} color={color.textWhite} />
                  <Text style={styles.coordinateButtonText}>座標からピン</Text>
                </Pressable>
              </View>
            </View>

            {draftPin ? (
              <>
                <View style={styles.pinMetaRow}>
                  <MaterialIcons name="check-circle" size={17} color={color.success} />
                  <Text style={styles.pinMetaText} numberOfLines={1}>
                    ピン: {formatPinCoordinate(draftPin)}
                    {draftPin.accuracy ? ` / 精度 ±${Math.round(draftPin.accuracy)}m` : ""}
                  </Text>
                </View>
                <PrecisionTileMap
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
              name={reportMutation.isPending ? "hourglass-top" : "place"}
              size={20}
              color={color.textWhite}
            />
            <Text style={styles.reportButtonText}>
              {reportMutation.isPending ? "申告中..." : "このピンで申告"}
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
            <PrecisionTileMap
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#07111F",
  },
  headerHomeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: "#00427B33",
  },
  content: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 44,
    gap: 14,
  },
  heroBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(20,184,166,0.38)",
    backgroundColor: "rgba(10,22,38,0.92)",
    padding: 16,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: color.teal500,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 3,
  },
  heroTitle: {
    color: color.textWhite,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  heroCopy: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  formPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  inputBlock: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  inputLabel: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: palette.white,
    color: color.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  noteInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  pinPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: "rgba(10,22,38,0.04)",
    padding: 12,
    gap: 10,
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.accentIndigo,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pinHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  pinTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  pinSub: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  pinActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "stretch",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: color.accentIndigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  secondaryButtonDisabled: {
    backgroundColor: color.borderAlt,
  },
  secondaryButtonText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "900",
  },
  coordinateGroup: {
    flex: 1,
    minWidth: 260,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  coordinateInput: {
    flex: 1,
    minWidth: 210,
  },
  coordinateButton: {
    minHeight: 46,
    minWidth: 132,
    borderRadius: 8,
    backgroundColor: color.accentPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  coordinateButtonText: {
    color: color.textWhite,
    fontSize: 13,
    fontWeight: "900",
  },
  pinMetaRow: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.success + "44",
    backgroundColor: color.success + "10",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
  },
  pinMetaText: {
    color: color.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  pinPreviewMap: {
    width: "100%",
  },
  pinEmptyLine: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: palette.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  pinEmptyText: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  reportButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: color.accentPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  reportButtonDisabled: {
    backgroundColor: color.borderAlt,
  },
  reportButtonText: {
    color: color.textWhite,
    fontSize: 15,
    fontWeight: "900",
  },
  statusBar: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.success + "55",
    backgroundColor: color.success + "12",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  errorBar: {
    borderColor: color.danger + "55",
    backgroundColor: color.danger + "12",
  },
  statusText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  errorText: {
    color: color.danger,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    color: color.accentPrimary,
    fontSize: 25,
    fontWeight: "900",
  },
  summaryLabel: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  mapPanel: {
    alignItems: "center",
  },
  mapFrame: {
    width: "100%",
  },
  emptyMap: {
    minHeight: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  listHeader: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  latestText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
  },
  reportRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 12,
    flexDirection: "row",
    gap: 12,
  },
  pinBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.accentAlt,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reportBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  reportTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  reportName: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
  },
  reportTime: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 0,
  },
  reportPlace: {
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  reportNote: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  reportMeta: {
    color: color.textMuted,
    fontSize: 11,
  },
});
