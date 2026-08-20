/**
 * 足あとカード（ボトムシート）— docs/uiux-brushup-SPEC.md §3.3
 *
 * 地図上のピンをタップした時に下から出る詳細シート。
 * ネストカード禁止のため、シート自体が唯一のカード。
 */

import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, contentMaxWidth, borderRadius, spacing } from "@/theme/tokens";
import {
  formatPlace,
  formatDateTime,
  formatCoordinate,
  type TrailPoint,
} from "@/components/organisms/precision-tile-map";
import { NavigateToPlaceButton } from "@/components/molecules/navigate-to-place-button";
import { usePrefWeather, formatWeatherLine } from "@/hooks/use-pref-weather";
import { useLiveStream, formatLiveStreamLabel } from "@/hooks/use-live-stream";
import {
  liveCameraLinkFor,
  youtubeLiveSearchUrl,
} from "@/lib/live-camera/live-camera-links";
import { openExternalUrl } from "@/lib/navigation/external-links";
import {
  hasPlaceNote,
  isPlaceNoteStale,
  formatPlaceNoteDate,
} from "@/modules/encounter/core/place-note";
import {
  locationVisibilityLabel,
  parseLocationVisibility,
  type LocationVisibility,
} from "@/modules/encounter/core/location-visibility";

type FootprintSheetProps = {
  point: TrailPoint | null;
  visible: boolean;
  onClose: () => void;
  canManage?: boolean;
  onDeleteLocation?: (locationId: number) => void;
  onToggleVisibility?: (locationId: number, next: LocationVisibility) => void;
  /** 本人のみ。場所メモの編集を開く */
  onEditNote?: (point: TrailPoint) => void;
  isDeleting?: boolean;
  isUpdatingVisibility?: boolean;
};

export function FootprintSheet({
  point,
  visible,
  onClose,
  canManage = false,
  onDeleteLocation,
  onToggleVisibility,
  onEditNote,
  isDeleting = false,
  isUpdatingVisibility = false,
}: FootprintSheetProps) {
  // フックは早期 return より前に呼ぶ（point が null でも呼び出し回数を変えない）
  const { weather } = usePrefWeather(point?.prefecture, point?.municipality);
  const weatherLine = formatWeatherLine(point?.prefecture, weather);

  const [liveOpenFailed, setLiveOpenFailed] = useState(false);
  const youtubeUrl = youtubeLiveSearchUrl(
    point?.municipality ?? point?.prefecture ?? null,
  );

  /* 配信中の映像が特定できたら検索結果ページではなく映像へ直行する。
     取れなければ従来どおり検索リンク（キー未設定・quota超過・該当なしでも導線は消えない）。
     ★この画面と place-context-bar.tsx の2経路あるので必ず両方直すこと
       （OGP で片方だけ直して本番に出ていなかった前例がある）。 */
  const { stream } = useLiveStream(point?.prefecture, point?.municipality);
  const liveUrl = stream?.url ?? youtubeUrl;
  const liveLabel = formatLiveStreamLabel(stream);

  /* 国交省の一覧ページは映像まで数ステップかかる。直行できるなら上位互換なので隠す。
     直行が取れない県では唯一の手段なので必ず残す（2026-08-21 ユーザー判断）。 */
  const cameraLink = stream ? null : liveCameraLinkFor(point?.prefecture);

  /** 外部リンクを開く。false を握り潰さず画面で伝える（無反応を作らない） */
  const handleOpenLive = async (url: string) => {
    const opened = await openExternalUrl(url);
    setLiveOpenFailed(!opened);
  };

  if (!point) return null;

  const visibility = parseLocationVisibility(point.visibility);
  const isPublic = visibility === "public";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.place} numberOfLines={3}>
            {formatPlace(point)}
          </Text>
          <Text style={styles.meta}>{formatDateTime(point.recordedAt)}</Text>
          <Text style={styles.coord}>
            {formatCoordinate(point)}
            {point.accuracyM ? `  ±${Math.round(point.accuracyM)}m` : ""}
          </Text>

          {/* その場所のきょうの天気。取れないときは行ごと出さない（気象庁JSONは無保証）。
              常設せずタップした人にだけ見せることで、着地ページの情報過多を避ける */}
          {weatherLine ? <Text style={styles.weather}>{weatherLine}</Text> : null}

          {/* 場所メモ。地図の情報パネルには出さず、ここ（地図の外側）にだけ置く。
              「いつの情報か」を必ず添え、30日超は減光する（docs/place-info-DESIGN.md） */}
          {hasPlaceNote(point) ? (
            <View style={styles.noteBlock}>
              {point.placeName ? (
                <Text style={styles.notePlaceName} numberOfLines={2}>
                  {point.placeName}
                </Text>
              ) : null}
              {point.note ? (
                <Text
                  style={[
                    styles.noteBody,
                    isPlaceNoteStale(point.noteUpdatedAt) && styles.noteStale,
                  ]}
                >
                  {point.note}
                </Text>
              ) : null}
              {formatPlaceNoteDate(point.noteUpdatedAt) ? (
                <Text style={styles.noteDate}>
                  {formatPlaceNoteDate(point.noteUpdatedAt)}
                  {isPlaceNoteStale(point.noteUpdatedAt) ? "・古い情報です" : ""}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <NavigateToPlaceButton
              lat={point.lat}
              lng={point.lng}
              placeLabel={formatPlace(point)}
              label="ここへ向かう"
              fullWidth
              testID="footprint-sheet-navigate"
            />
          </View>

          {/* いまの様子を見に行く導線。
              国交省の公式一覧は無料で見られるが対応していない県があるので、
              その場合も YouTube のライブ検索なら必ず開ける（穴を作らない）。
              画像APIは有償・埋め込みは規約グレーなので、どちらもリンクで開くだけ。 */}
          <View style={styles.liveRow}>
            {cameraLink ? (
              <Pressable
                onPress={() => void handleOpenLive(cameraLink.url)}
                style={({ pressed }) => [styles.liveButton, pressed && { opacity: 0.75 }]}
                accessibilityRole="link"
                accessibilityLabel={cameraLink.label}
                testID="footprint-sheet-live-camera"
              >
                <MaterialIcons name="videocam" size={16} color={color.textSecondary} />
                <Text style={styles.liveButtonText}>ライブカメラ（国交省）</Text>
              </Pressable>
            ) : null}
            {liveUrl ? (
              <Pressable
                onPress={() => void handleOpenLive(liveUrl)}
                style={({ pressed }) => [
                  styles.liveButton,
                  stream && styles.liveButtonDirect,
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="link"
                accessibilityLabel={
                  stream
                    ? `ライブ配信中: ${stream.title} を見る`
                    : `${formatPlace(point)}のライブ配信を探す`
                }
                testID="footprint-sheet-live-youtube"
              >
                <MaterialIcons
                  name={stream ? "sensors" : "live-tv"}
                  size={16}
                  color={stream ? color.accentPrimary : color.textSecondary}
                />
                <Text
                  style={[styles.liveButtonText, stream && styles.liveButtonTextDirect]}
                  numberOfLines={1}
                >
                  {liveLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {liveOpenFailed ? (
            <Text style={styles.liveError}>開けませんでした。もう一度お試しください。</Text>
          ) : null}

          {canManage ? (
            <View style={styles.manageRow}>
              {onEditNote ? (
                <Pressable
                  onPress={() => onEditNote(point)}
                  style={({ pressed }) => [styles.manageButton, styles.noteButton, pressed && { opacity: 0.75 }]}
                  accessibilityLabel={hasPlaceNote(point) ? "メモを編集" : "メモを添える"}
                >
                  <Text style={[styles.manageButtonText, styles.noteButtonText]}>
                    {hasPlaceNote(point) ? "メモを編集" : "メモを添える"}
                  </Text>
                </Pressable>
              ) : null}
              {onToggleVisibility ? (
                <Pressable
                  onPress={() => onToggleVisibility(point.id, isPublic ? "private" : "public")}
                  disabled={isUpdatingVisibility}
                  style={({ pressed }) => [
                    styles.manageButton,
                    isPublic ? styles.manageButtonPublic : styles.manageButtonPrivate,
                    pressed && !isUpdatingVisibility && { opacity: 0.75 },
                    isUpdatingVisibility && { opacity: 0.5 },
                  ]}
                  accessibilityLabel={`${locationVisibilityLabel(visibility)}。タップで切り替え`}
                >
                  {isUpdatingVisibility ? (
                    <ActivityIndicator size="small" color={color.accentIndigo} />
                  ) : (
                    <Text
                      style={[
                        styles.manageButtonText,
                        isPublic ? styles.manageButtonTextPublic : styles.manageButtonTextPrivate,
                      ]}
                    >
                      {locationVisibilityLabel(visibility)}
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {onDeleteLocation ? (
                <Pressable
                  onPress={() => onDeleteLocation(point.id)}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && !isDeleting && { opacity: 0.75 },
                    isDeleting && { opacity: 0.5 },
                  ]}
                  accessibilityLabel="この足あとを削除"
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={color.danger} />
                  ) : (
                    <>
                      <MaterialIcons name="delete-outline" size={18} color={color.danger} />
                      <Text style={styles.deleteButtonText}>削除</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="閉じる">
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    backgroundColor: color.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.border,
    marginBottom: spacing.sm,
  },
  place: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  meta: {
    color: color.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  coord: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  // 天気は文章なので tabular-nums を付けない（数値・座標系の書体は座標行だけに使う）
  weather: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  noteButton: {
    backgroundColor: color.surfaceEmphasis,
  },
  noteButtonText: {
    color: color.accentPrimary,
  },
  noteBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,66,123,0.12)",
    gap: 4,
  },
  notePlaceName: {
    fontSize: 15,
    fontWeight: "700",
    color: color.textPrimary,
  },
  noteBody: {
    fontSize: 14,
    lineHeight: 21,
    color: color.textPrimary,
  },
  noteStale: {
    color: color.textMuted,
  },
  noteDate: {
    fontSize: 11,
    color: color.textMuted,
  },
  actionRow: {
    marginTop: spacing.sm,
  },
  // 「ここへ向かう」より控えめ。主役はあくまで足あとの場所
  liveRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  liveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  /* 映像へ直行できるときは、押せば見られることが分かるように強調する。
     配信名が入るぶん幅を取るので、行の中で伸び縮みできるようにする。 */
  liveButtonDirect: {
    borderColor: color.accentPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  liveButtonText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  liveButtonTextDirect: {
    color: color.accentPrimary,
    fontWeight: "800",
    flexShrink: 1,
    minWidth: 0,
  },
  liveError: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  manageRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  manageButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  manageButtonPublic: {
    backgroundColor: color.accentIndigo + "18",
    borderColor: color.accentIndigo + "55",
  },
  manageButtonPrivate: {
    backgroundColor: color.surfaceAlt,
    borderColor: color.border,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  manageButtonTextPublic: {
    color: color.accentIndigo,
  },
  manageButtonTextPrivate: {
    color: color.textMuted,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.danger + "44",
    backgroundColor: color.danger + "10",
  },
  deleteButtonText: {
    color: color.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  closeButtonText: {
    color: color.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
});
