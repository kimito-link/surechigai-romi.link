// components/organisms/tutorial-overlay/previews.tsx
// 君斗りんく — ライト UI プレビュー
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Circle, G, Rect } from "react-native-svg";
import { color, palette } from "@/theme/tokens";

const previewCard = {
  alignItems: "center" as const,
  backgroundColor: palette.kimitoBlueSoft,
  borderRadius: 14,
  padding: 14,
  minWidth: 240,
  borderWidth: 1,
  borderColor: palette.kimitoBlue + "18",
};

const caption = {
  color: color.textMuted,
  fontSize: 11,
  marginTop: 8,
  textAlign: "center" as const,
};

export function MapPreview() {
  return (
    <View style={previewCard}>
      <Svg width={200} height={100} viewBox="0 0 200 100">
        <G>
          <Circle cx={130} cy={35} r={10} fill={palette.kimitoOrange} opacity={0.85} />
          <Circle cx={115} cy={55} r={8} fill={palette.kimitoBlue} opacity={0.7} />
          <Circle cx={95} cy={62} r={12} fill={palette.kimitoPurple} opacity={0.75} />
          <Circle cx={72} cy={68} r={7} fill={palette.teal600} opacity={0.65} />
        </G>
        <Rect x={8} y={8} width={10} height={10} rx={2} fill={palette.kimitoOrange} />
        <Rect x={8} y={24} width={10} height={10} rx={2} fill={palette.kimitoBlue} />
      </Svg>
      <Text style={caption}>公開中の都道府県マップ</Text>
    </View>
  );
}

export function CheckinPreview() {
  return (
    <View style={previewCard}>
      <View style={styles.checkinButton}>
        <MaterialIcons name="my-location" size={18} color={palette.white} />
        <Text style={styles.checkinLabel}>チェックイン</Text>
      </View>
      <Text style={caption}>タブバー「チェックイン」— 1タップで足あと</Text>
    </View>
  );
}

export function EnvelopePreview() {
  return (
    <View style={previewCard}>
      <View style={styles.rowCard}>
        <Text style={styles.emoji}>✉️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>未開封の封筒</Text>
          <Text style={styles.cardBody}>長野県 · 同じ場所を通過</Text>
        </View>
      </View>
      <Text style={caption}>「現在地」タブに届く — タップで開封</Text>
    </View>
  );
}

export function TrailPreview() {
  return (
    <View style={previewCard}>
      <View style={styles.trailMap}>
        <View style={styles.trailPin} />
        <View style={[styles.trailLine, { transform: [{ rotate: "25deg" }] }]} />
        <View style={[styles.trailPin, styles.trailPinAlt]} />
      </View>
      <Text style={caption}>軌跡タブ — OpenStreetMap 上の足あと</Text>
    </View>
  );
}

export function NavigatePreview() {
  return (
    <View style={previewCard}>
      <View style={styles.navButton}>
        <MaterialIcons name="navigation" size={16} color={palette.white} />
        <Text style={styles.navButtonText}>ここへ向かう</Text>
      </View>
      <Text style={caption}>Google マップ / Apple マップでナビ開始</Text>
    </View>
  );
}

export function EventsPreview() {
  return (
    <View style={previewCard}>
      <View style={styles.segmentRow}>
        <View style={[styles.segment, styles.segmentActive]}>
          <Text style={styles.segmentTextActive}>予定</Text>
        </View>
        <View style={styles.segment}>
          <Text style={styles.segmentText}>ライブ中</Text>
        </View>
      </View>
      <View style={styles.eventRow}>
        <MaterialIcons name="calendar-today" size={16} color={palette.kimitoBlue} />
        <View>
          <Text style={styles.cardTitle}>7/15 14:00 推し活ライブ</Text>
          <Text style={styles.cardBody}>東京都 · ライブ表明中</Text>
        </View>
      </View>
      <Text style={caption}>集まりタブ — カレンダーとライブ追尾</Text>
    </View>
  );
}

/** @deprecated レガシー doin-challenge 用 */
export function ParticipantsPreview() {
  return null;
}

/** @deprecated レガシー doin-challenge 用 */
export function ChartPreview() {
  return null;
}

/** @deprecated レガシー doin-challenge 用 */
export function NotificationPreview() {
  return <EventsPreview />;
}

/** @deprecated レガシー doin-challenge 用 */
export function CrownPreview() {
  return null;
}

export function PreviewComponent({ type }: { type?: string }) {
  switch (type) {
    case "map":
      return <MapPreview />;
    case "checkin":
      return <CheckinPreview />;
    case "envelope":
      return <EnvelopePreview />;
    case "trail":
      return <TrailPreview />;
    case "navigate":
      return <NavigatePreview />;
    case "events":
      return <EventsPreview />;
    case "notification":
      return <EventsPreview />;
    case "participants":
    case "chart":
    case "crown":
      return null;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  checkinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  checkinLabel: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "800",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "18",
  },
  emoji: {
    fontSize: 26,
  },
  cardTitle: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  cardBody: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  trailMap: {
    width: 200,
    height: 80,
    backgroundColor: palette.white,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "18",
  },
  trailPin: {
    position: "absolute",
    left: 28,
    top: 44,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.kimitoBlue,
    borderWidth: 2,
    borderColor: palette.white,
  },
  trailPinAlt: {
    left: 130,
    top: 20,
    backgroundColor: palette.kimitoOrange,
  },
  trailLine: {
    position: "absolute",
    left: 34,
    top: 36,
    width: 100,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.kimitoBlue + "44",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.kimitoBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  navButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "800",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    width: "100%",
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "22",
  },
  segmentActive: {
    backgroundColor: palette.kimitoBlueSoft,
    borderColor: palette.kimitoBlue,
  },
  segmentText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "18",
  },
});
