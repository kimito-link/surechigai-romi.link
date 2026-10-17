import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";

const BLUE_10 = `${palette.kimitoBlue}1A`;
const BLUE_18 = `${palette.kimitoBlue}2E`;
const BLUE_45 = `${palette.kimitoBlue}73`;
const ROAD = palette.kimitoBorderSoft;

/** ヒーロー全面描画用。高さは親(hero)が決め、このSurfaceは常にabsoluteFillで埋める。 */
function PreviewSurface({ children }: { children: React.ReactNode }) {
  return <View style={styles.surface}>{children}</View>;
}

/** ポートレート基準の道路グリッド。slice方式でどのアスペクト比でも余白なく全面を埋める。 */
function RoadGrid({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <PreviewSurface>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="390" height="560" fill={palette.white} />
        <Line x1="60" y1="0" x2="150" y2="560" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="220" y1="0" x2="180" y2="560" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="340" y1="0" x2="290" y2="560" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="120" x2="390" y2="90" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="300" x2="390" y2="320" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="470" x2="390" y2="450" stroke={ROAD} strokeWidth="1.5" />
        {children}
      </Svg>
      {overlay}
    </PreviewSurface>
  );
}

export function CheckinGuestPreview() {
  return (
    <RoadGrid
      overlay={
        <>
          <Text style={[styles.previewChip, styles.checkinTime]}>14:32 記録</Text>
          <Text style={[styles.previewPlace, styles.checkinPlace]}>渋谷区・東京都</Text>
        </>
      }
    >
      <Circle cx="195" cy="290" r="90" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Path
        d="M195 220c-25 0-46 19-46 45 0 33 46 87 46 87s46-54 46-87c0-26-21-45-46-45z"
        fill={palette.kimitoBlue}
      />
      <Circle cx="195" cy="264" r="15" fill={palette.white} />
      <Rect x="110" y="140" width="170" height="46" rx="8" fill={palette.white} stroke={ROAD} strokeWidth="1" />
    </RoadGrid>
  );
}

export function TrailGuestPreview() {
  return (
    <RoadGrid
      overlay={<Text style={[styles.previewChip, styles.trailTime]}>09:18</Text>}
    >
      <Polyline
        points="90,420 145,350 175,260 235,220 280,150"
        fill="none"
        stroke={palette.kimitoBlue}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[90, 145, 175, 235].map((x, idx) => (
        <Circle
          key={x}
          cx={x}
          cy={[420, 350, 260, 220][idx]}
          r="7"
          fill={palette.white}
          stroke={palette.kimitoBlue}
          strokeWidth="2.5"
        />
      ))}
      <Circle cx="280" cy="150" r="56" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Circle cx="280" cy="150" r="8" fill={palette.kimitoOrange} />
      <Rect x="200" y="70" width="100" height="38" rx="8" fill={palette.white} stroke={ROAD} strokeWidth="1" />
    </RoadGrid>
  );
}

export function RadarGuestPreview() {
  return (
    <PreviewSurface>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 240"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="390" height="240" fill={palette.white} />
        {/* 周辺道路グリッド */}
        <Line x1="55" y1="0" x2="115" y2="240" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="255" y1="0" x2="225" y2="240" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="345" y1="0" x2="310" y2="240" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="56" x2="390" y2="42" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="184" x2="390" y2="196" stroke={ROAD} strokeWidth="1.5" />
        {/* レーダー同心円と精度円 */}
        <Circle cx="195" cy="116" r="38" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
        <Circle cx="195" cy="116" r="74" fill="none" stroke={BLUE_18} strokeWidth="1.5" />
        <Circle cx="195" cy="116" r="110" fill="none" stroke={BLUE_18} strokeWidth="1.5" />
        {/* 十字走査線とスキャンライン */}
        <Line x1="195" y1="12" x2="195" y2="220" stroke={ROAD} strokeWidth="1" />
        <Line x1="40" y1="116" x2="350" y2="116" stroke={ROAD} strokeWidth="1" />
        <Line
          x1="195"
          y1="116"
          x2="278"
          y2="52"
          stroke={palette.kimitoBlue}
          strokeWidth="2"
          strokeOpacity="0.45"
        />
        {/* 他の足あとシグナル点 */}
        <Circle cx="128" cy="82" r="5" fill={palette.kimitoBlue} />
        <Circle cx="264" cy="144" r="5" fill={palette.kimitoBlue} />
        {/* 現在地ピン（オレンジ核＋白縁） */}
        <Circle cx="195" cy="116" r="13" fill={palette.white} />
        <Circle cx="195" cy="116" r="9" fill={palette.kimitoOrange} />
      </Svg>
      <View style={styles.radarPlaceBadge}>
        <MaterialIcons name="my-location" size={14} color={palette.kimitoBlue} />
        <Text style={styles.radarPlaceText}>秋葉原・東京都</Text>
        <Text style={styles.radarAccuracyText}>14:32 · ±12m</Text>
      </View>
      <View style={styles.envelope}>
        <MaterialIcons name="mail" size={16} color={palette.kimitoOrangeText} />
        <Text style={styles.envelopeBadgeText}>すれ違ひ 2通</Text>
      </View>
      <View style={styles.radarBottomBar}>
        <Text style={styles.radarCaption}>正確な現在地を刻み、すれ違ひの封筒を受信</Text>
      </View>
    </PreviewSurface>
  );
}

export function MypageGuestPreview() {
  return (
    <PreviewSurface>
      <View style={styles.mypagePreviewCenter}>
        <View style={styles.profileMock}>
          <View style={styles.avatarGhost}>
            <MaterialIcons name="person" size={44} color={color.textHint} />
          </View>
          <View style={styles.skeletonStack}>
            <View style={[styles.skeleton, { width: "68%" }]} />
            <View style={[styles.skeleton, { width: "92%" }]} />
            <View style={[styles.skeleton, { width: "78%" }]} />
          </View>
        </View>
        <View style={styles.settingsMock}>
          {["公開範囲", "一時停止", "X連携"].map((label) => (
            <View key={label} style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>{label}</Text>
              <View style={styles.settingsPill} />
            </View>
          ))}
        </View>
      </View>
    </PreviewSurface>
  );
}

export function EventsGuestPreview() {
  return null;
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  previewChip: {
    position: "absolute",
    color: color.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  previewPlace: {
    position: "absolute",
    color: palette.kimitoBlue,
    fontSize: 15,
    fontWeight: "800",
  },
  checkinTime: {
    left: "50%",
    marginLeft: -70,
    top: "36%",
  },
  checkinPlace: {
    left: "50%",
    marginLeft: -70,
    top: "36%",
    marginTop: 20,
  },
  trailTime: {
    right: 24,
    top: "20%",
  },
  radarPlaceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  radarPlaceText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  radarAccuracyText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  envelope: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  envelopeBadgeText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  radarBottomBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: palette.kimitoBg,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    alignItems: "center",
  },
  radarCaption: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  mypagePreviewCenter: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    justifyContent: "center",
  },
  profileMock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 28,
  },
  avatarGhost: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.kimitoBorderSoft,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.72,
  },
  skeletonStack: {
    flex: 1,
    gap: 10,
  },
  skeleton: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.kimitoBorderSoft,
  },
  settingsMock: {
    marginTop: 24,
    paddingHorizontal: 28,
    gap: 10,
  },
  settingsRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsLabel: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  settingsPill: {
    width: 42,
    height: 18,
    borderRadius: 999,
    backgroundColor: palette.kimitoBorderSoft,
  },
});
