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
        viewBox="0 0 390 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="390" height="560" fill={palette.white} />
        <Circle cx="195" cy="280" r="60" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Circle cx="195" cy="280" r="120" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Circle cx="195" cy="280" r="180" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Line x1="195" y1="60" x2="195" y2="500" stroke={ROAD} strokeWidth="1" />
        <Line x1="30" y1="280" x2="360" y2="280" stroke={ROAD} strokeWidth="1" />
        <Circle cx="195" cy="280" r="10" fill={palette.kimitoOrange} />
      </Svg>
      <View style={styles.envelope}>
        <MaterialIcons name="mail-outline" size={24} color={palette.kimitoBlue} />
      </View>
      <Text style={styles.radarCaption}>封筒が届くかも</Text>
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
  envelope: {
    position: "absolute",
    top: "34%",
    left: "62%",
    width: 44,
    height: 34,
    borderRadius: 8,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  radarCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "58%",
    color: color.textMuted,
    fontSize: 13,
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
