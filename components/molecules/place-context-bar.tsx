/**
 * 足あとの場所の「いまの様子」バー（天気 + ライブカメラ導線）。
 *
 * ★2026-08-16 に新設した理由:
 *   天気もライブカメラも実装済みだったが、**地図のピンを押して開くシートの中だけ**にあり、
 *   画面にその存在を示す手がかりが無かった。「さわらないと気づかれない機能は
 *   機能していない」という指摘を受け、押さなくても目に入る位置に常時出す。
 *   （シート内の表示は残す。ここは入口を増やすだけで、機能を移動していない）
 *
 * ★位置情報を新しく取らない: 保存済みの prefecture / municipality 文字列しか使わない。
 * ★天気が取れなければ行ごと消す(fail-silent)。気象庁JSONは無保証なので待たせない。
 * ★ライブカメラは対応していない県のほうが多い。無い県では国交省の導線を出さず、
 *   必ず開ける YouTube 検索だけを出す（押しても無反応、を作らない）。
 */
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useState } from "react";
import MaterialIcons from "@/lib/icons/material-icons";
import { usePrefWeather, formatWeatherLine } from "@/hooks/use-pref-weather";
import {
  liveCameraLinkFor,
  youtubeLiveSearchUrl,
} from "@/lib/live-camera/live-camera-links";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { color, contentMaxWidth } from "@/theme/tokens";

type PlaceContextBarProps = {
  prefecture: string | null | undefined;
  municipality?: string | null;
};

export function PlaceContextBar({ prefecture, municipality }: PlaceContextBarProps) {
  // 外部リンクが開けなかったことを黙って捨てない（無反応が最悪の体験）
  const [openFailed, setOpenFailed] = useState(false);

  const { weather } = usePrefWeather(prefecture, municipality);
  const weatherLine = formatWeatherLine(prefecture, weather);
  const cameraLink = liveCameraLinkFor(prefecture);
  const youtubeUrl = youtubeLiveSearchUrl(municipality ?? prefecture ?? null);

  const handleOpen = async (url: string) => {
    const opened = await openExternalUrl(url);
    setOpenFailed(!opened);
  };

  // 天気も導線も無いなら、空の枠だけ出しても意味がないので何も出さない
  if (!weatherLine && !cameraLink && !youtubeUrl) return null;

  return (
    <View style={styles.wrap}>
      {weatherLine ? (
        <View style={styles.weatherRow}>
          <MaterialIcons name="wb-sunny" size={14} color={color.textSecondary} />
          <Text style={styles.weatherText} numberOfLines={2}>
            {weatherLine}
          </Text>
        </View>
      ) : null}

      {cameraLink || youtubeUrl ? (
        <View style={styles.liveRow}>
          <Text style={styles.liveLabel}>いまの様子</Text>
          {cameraLink ? (
            <Pressable
              onPress={() => void handleOpen(cameraLink.url)}
              style={({ pressed }) => [
                styles.liveButton,
                pressed && { opacity: 0.75 },
                Platform.OS === "web" && styles.pressableWeb,
              ]}
              accessibilityRole="link"
              accessibilityLabel={cameraLink.label}
              testID="place-context-live-camera"
            >
              <MaterialIcons name="videocam" size={14} color={color.textSecondary} />
              <Text style={styles.liveButtonText}>ライブカメラ</Text>
            </Pressable>
          ) : null}
          {youtubeUrl ? (
            <Pressable
              onPress={() => void handleOpen(youtubeUrl)}
              style={({ pressed }) => [
                styles.liveButton,
                pressed && { opacity: 0.75 },
                Platform.OS === "web" && styles.pressableWeb,
              ]}
              accessibilityRole="link"
              accessibilityLabel="YouTube でこの場所のライブ配信を探す"
              testID="place-context-youtube-live"
            >
              <MaterialIcons name="smart-display" size={14} color={color.textSecondary} />
              <Text style={styles.liveButtonText}>ライブ配信を探す</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {openFailed ? (
        <Text style={styles.failText}>
          開けませんでした。もう一度お試しください。
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weatherText: {
    flex: 1,
    minWidth: 0,
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  liveLabel: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  liveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  liveButtonText: {
    color: color.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  pressableWeb: {
    cursor: "pointer",
  } as const,
  failText: {
    color: color.textMuted,
    fontSize: 11,
  },
});

export default PlaceContextBar;
