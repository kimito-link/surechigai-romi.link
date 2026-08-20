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
import { useLiveStream, formatLiveStreamLabel } from "@/hooks/use-live-stream";
import {
  liveCameraLinkFor,
  youtubeLiveSearchUrl,
} from "@/lib/live-camera/live-camera-links";
import { openExternalUrl } from "@/lib/navigation/external-links";
import { resolvePlaceContext } from "@/lib/place-context/resolve-place-context";
import { color, contentMaxWidth } from "@/theme/tokens";

type PlaceContextBarProps = {
  prefecture: string | null | undefined;
  municipality?: string | null;
  /**
   * 自分の足あとがまだ無いときに代わりに見せる県（例: いま一番人がいる県）。
   *
   * ★2026-08-16: 足あとが1件も無いとこの機能ごと画面から消えていた。
   * 「データが無いと機能が存在しない」のはユーザーから見れば無いのと同じなので、
   * 始めたばかりの人にも「誰かがいる場所の今」が見えるようにする。
   *
   * 取得は呼び出し側の責任にしてある。ここで trpc.useQuery を呼ぶと
   * tRPC Provider 解決前に "Unable to find tRPC Context" で画面ごと落ちるため
   * （enabled:false では防げない。2026-07 に実障害あり）。
   */
  fallbackPrefecture?: string | null;
};

export function PlaceContextBar({
  prefecture,
  municipality,
  fallbackPrefecture = null,
}: PlaceContextBarProps) {
  // 外部リンクが開けなかったことを黙って捨てない（無反応が最悪の体験）
  const [openFailed, setOpenFailed] = useState(false);

  /* どの場所を見せるかの判断は純粋関数に切り出してある
     （JSX の中に書いていたため「足あと0件で機能ごと消える」に気づけなかった）。 */
  const {
    prefecture: shownPref,
    municipality: shownMuni,
    isFallback,
  } = resolvePlaceContext({ prefecture, municipality, fallbackPrefecture });

  const { weather } = usePrefWeather(shownPref, shownMuni);
  const weatherLine = formatWeatherLine(shownPref, weather);
  const youtubeUrl = youtubeLiveSearchUrl(shownMuni ?? shownPref ?? null);

  /* 配信中の映像が特定できたら、検索結果ページではなく映像へ直行する。
     取れなければ stream は null のままで、従来どおり検索リンクを出す
     （キー未設定・quota超過・該当なし、いずれも導線は消えない）。 */
  const { stream } = useLiveStream(shownPref, shownMuni);
  const liveUrl = stream?.url ?? youtubeUrl;
  const liveLabel = formatLiveStreamLabel(stream);

  /* 国交省の一覧ページ（ダムの図など）は映像まで数ステップかかる。
     直行できるならそちらが上位互換なので隠す。直行が取れない県では
     国交省が唯一の手段なので必ず残す（2026-08-21 ユーザー判断）。 */
  const cameraLink = stream ? null : liveCameraLinkFor(shownPref);

  const handleOpen = async (url: string) => {
    const opened = await openExternalUrl(url);
    setOpenFailed(!opened);
  };

  // 天気も導線も無いなら、空の枠だけ出しても意味がないので何も出さない
  if (!weatherLine && !cameraLink && !liveUrl) return null;

  return (
    <View style={styles.wrap}>
      {/* 自分の足あとではなく「いま人がいる県」を出しているときは、
          それが誰の場所なのかを必ず明示する（自分の現在地だと誤解させない）。 */}
      {isFallback ? (
        <Text style={styles.fallbackNote}>
          いま人がいるのは {shownPref}。チェックインすると、ここがあなたの場所になります
        </Text>
      ) : null}

      {weatherLine ? (
        <View style={styles.weatherRow}>
          <MaterialIcons name="wb-sunny" size={14} color={color.textSecondary} />
          <Text style={styles.weatherText} numberOfLines={2}>
            {weatherLine}
          </Text>
        </View>
      ) : null}

      {cameraLink || liveUrl ? (
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
          {liveUrl ? (
            <Pressable
              onPress={() => void handleOpen(liveUrl)}
              style={({ pressed }) => [
                styles.liveButton,
                stream && styles.liveButtonDirect,
                pressed && { opacity: 0.75 },
                Platform.OS === "web" && styles.pressableWeb,
              ]}
              accessibilityRole="link"
              accessibilityLabel={
                stream
                  ? `ライブ配信中: ${stream.title} を見る`
                  : "YouTube でこの場所のライブ配信を探す"
              }
              testID="place-context-youtube-live"
            >
              <MaterialIcons
                name={stream ? "sensors" : "smart-display"}
                size={14}
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
  /* 足あとが無い人に「いま人がいる県」を見せているときの注記。
     自分の現在地だと誤解させないために必ず出す。 */
  fallbackNote: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
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
    // Apple HIG の下限 44px。32 だと実測 106x32px で押しにくかった
    // （2026-08-19 本番実測・375px幅。kimitolink-linktree の ca8f327 と同型の穴）。
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  /* 映像へ直行できるときは、押せば見られることが分かるように強調する。
     配信名が入るぶん幅を取るので、行の中で伸び縮みできるようにしておく。 */
  liveButtonDirect: {
    borderColor: color.accentPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  liveButtonText: {
    color: color.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  liveButtonTextDirect: {
    // #00427B。白地（surface）で 11.6:1 ＝ AA を大きく上回る
    color: color.accentPrimary,
    flexShrink: 1,
    minWidth: 0,
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
