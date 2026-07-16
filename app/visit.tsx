/**
 * グループ訪問申告画面。
 * SNS投稿ではなく、共有グループコード内だけで訪問を申告・可視化する。
 *
 * 見た目(JSX)は components/visit/visit-screen-view.tsx に切り出し済み
 * (refactor-instructions.md Phase 7 Debt #11)。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import type { TrailPoint } from "@/lib/map/tile-geo";
import { useResponsive } from "@/hooks/use-responsive";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { getCheckinLocation, type CurrentLocation } from "@/lib/get-current-location";
import { formatCoordinate, parseCoordinateInput } from "@/lib/parse-coordinate-input";
import { VisitScreenView } from "@/components/visit/visit-screen-view";

type BrowserLocation = CurrentLocation;

const GROUP_CODE_STORAGE_KEY = "surechigai.groupVisit.groupCode";
const DISPLAY_NAME_STORAGE_KEY = "surechigai.groupVisit.displayName";
const VISITOR_TOKEN_STORAGE_KEY = "surechigai.groupVisit.visitorToken";

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

export default function GroupVisitScreen() {
  const { isDesktop } = useResponsive();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [groupCode, setGroupCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [draftPin, setDraftPin] = useState<BrowserLocation | null>(null);
  const [coordinateText, setCoordinateText] = useState("");
  // 座標/URL入力は補助。デフォルトは「現在地をピンにする」を主導線にする。
  const [showCoordInput, setShowCoordInput] = useState(false);
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
      const pos = await getCheckinLocation();
      setDraftPin(pos);
      setCoordinateText(formatCoordinate(pos.lat, pos.lng));
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
    setCoordinateText(formatCoordinate(parsed.lat, parsed.lng));
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
    <VisitScreenView
      isDesktop={isDesktop}
      isAuthenticated={isAuthenticated}
      isFetching={visitQuery.isFetching}
      canReadGroup={canReadGroup}
      onRefresh={() => void visitQuery.refetch()}
      groupCode={groupCode}
      setGroupCode={setGroupCode}
      displayName={displayName}
      setDisplayName={setDisplayName}
      placeName={placeName}
      setPlaceName={setPlaceName}
      note={note}
      setNote={setNote}
      showCoordInput={showCoordInput}
      setShowCoordInput={setShowCoordInput}
      coordinateText={coordinateText}
      setCoordinateText={setCoordinateText}
      draftPin={draftPin}
      draftPinPoints={draftPinPoints}
      handleSetCurrentPin={handleSetCurrentPin}
      handleApplyCoordinatePin={handleApplyCoordinatePin}
      handleReport={handleReport}
      isReportPending={reportMutation.isPending}
      submitDisabled={submitDisabled}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      stats={stats}
      mapPoints={mapPoints}
      reports={reports}
      formatDateTime={formatDateTime}
      formatReportPlace={formatReportPlace}
    />
  );
}
