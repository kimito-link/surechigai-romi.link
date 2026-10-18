import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";

const BLUE_06 = `${palette.kimitoBlue}0F`;
const BLUE_10 = `${palette.kimitoBlue}1A`;
const BLUE_18 = `${palette.kimitoBlue}2E`;
const BLUE_45 = `${palette.kimitoBlue}73`;
const ORANGE_14 = `${palette.kimitoOrange}24`;
const ROAD = palette.kimitoBorderSoft;
const BLOCK_FILL = palette.kimitoBg;

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
        {/* 街区ブロック（地図らしい面密度を出す） */}
        <Rect x="16" y="18" width="90" height="74" rx="6" fill={BLOCK_FILL} />
        <Rect x="130" y="16" width="110" height="68" rx="6" fill={BLOCK_FILL} />
        <Rect x="262" y="20" width="112" height="62" rx="6" fill={BLOCK_FILL} />
        <Rect x="20" y="132" width="98" height="142" rx="6" fill={BLOCK_FILL} />
        <Rect x="242" y="118" width="128" height="164" rx="6" fill={BLOCK_FILL} />
        <Rect x="28" y="330" width="112" height="114" rx="6" fill={BLOCK_FILL} />
        <Rect x="234" y="340" width="134" height="96" rx="6" fill={BLOCK_FILL} />
        {/* 主要幹線道路 */}
        <Line x1="60" y1="0" x2="150" y2="560" stroke={ROAD} strokeWidth="6" />
        <Line x1="220" y1="0" x2="180" y2="560" stroke={ROAD} strokeWidth="5" />
        <Line x1="340" y1="0" x2="290" y2="560" stroke={ROAD} strokeWidth="3" />
        <Line x1="0" y1="112" x2="390" y2="92" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="304" x2="390" y2="322" stroke={ROAD} strokeWidth="6" />
        <Line x1="0" y1="468" x2="390" y2="448" stroke={ROAD} strokeWidth="4" />
        {/* 鉄道ライン（破線） */}
        <Line
          x1="12"
          y1="210"
          x2="378"
          y2="178"
          stroke={BLUE_18}
          strokeWidth="2"
          strokeDasharray="6,6"
        />
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
        <View style={styles.checkinCardOverlay}>
          <View style={styles.checkinBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.checkinMetaText}>GPS固定 · 14:32 · 精度 ±8m</Text>
          </View>
          <Text style={styles.checkinPlaceTitle}>渋谷区道玄坂・東京都</Text>
          <Text style={styles.checkinCoordText}>35.6595°N, 139.7005°E · H3 r8</Text>
        </View>
      }
    >
      <Circle cx="195" cy="290" r="108" fill={BLUE_06} stroke={BLUE_18} strokeWidth="1" />
      <Circle cx="195" cy="290" r="68" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Circle cx="195" cy="290" r="32" fill={ORANGE_14} />
      <Path
        d="M195 224c-24 0-43 18-43 42 0 31 43 82 43 82s43-51 43-82c0-24-19-42-43-42z"
        fill={palette.kimitoOrange}
      />
      <Circle cx="195" cy="265" r="14" fill={palette.white} />
      <Circle cx="128" cy="228" r="6" fill={palette.kimitoBlue} />
      <Circle cx="268" cy="348" r="6" fill={palette.kimitoBlue} />
    </RoadGrid>
  );
}

export function TrailGuestPreview() {
  return (
    <RoadGrid
      overlay={
        <View style={styles.trailCardOverlay}>
          <View style={styles.trailBadgeRow}>
            <MaterialIcons name="timeline" size={14} color={palette.kimitoBlue} />
            <Text style={styles.trailOverlayTitle}>今日の軌跡 · 4地点を記録</Text>
          </View>
          <Text style={styles.trailOverlaySub}>秋葉原 → 神田 → 東京駅 → 有楽町</Text>
        </View>
      }
    >
      <Polyline
        points="90,420 145,350 175,260 235,220 280,150"
        fill="none"
        stroke={BLUE_18}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <Circle cx="280" cy="150" r="12" fill={palette.white} />
      <Circle cx="280" cy="150" r="8" fill={palette.kimitoOrange} />
    </RoadGrid>
  );
}

export function RadarGuestPreview() {
  return (
    <PreviewSurface>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 480 340"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x="0" y="0" width="480" height="340" fill={palette.white} />
        {/* 街区ブロック（地図の密度と現在地らしさ） */}
        <Rect x="16" y="16" width="110" height="72" rx="6" fill={BLOCK_FILL} />
        <Rect x="148" y="14" width="136" height="64" rx="6" fill={BLOCK_FILL} />
        <Rect x="308" y="18" width="152" height="70" rx="6" fill={BLOCK_FILL} />
        <Rect x="14" y="112" width="96" height="112" rx="6" fill={BLOCK_FILL} />
        <Rect x="358" y="114" width="106" height="110" rx="6" fill={BLOCK_FILL} />
        <Rect x="22" y="246" width="124" height="78" rx="6" fill={BLOCK_FILL} />
        <Rect x="328" y="248" width="134" height="76" rx="6" fill={BLOCK_FILL} />

        {/* 周辺道路グリッド */}
        <Line x1="136" y1="0" x2="118" y2="340" stroke={ROAD} strokeWidth="5" />
        <Line x1="296" y1="0" x2="318" y2="340" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="98" x2="480" y2="86" stroke={ROAD} strokeWidth="5" />
        <Line x1="0" y1="236" x2="480" y2="244" stroke={ROAD} strokeWidth="5" />
        <Line
          x1="0"
          y1="166"
          x2="480"
          y2="152"
          stroke={BLUE_18}
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* 過去の移動軌跡ライン */}
        <Polyline
          points="92,262 152,214 196,184 240,158"
          fill="none"
          stroke={palette.kimitoBlue}
          strokeWidth="3"
          strokeDasharray="4,4"
          strokeOpacity="0.55"
        />
        <Circle cx="92" cy="262" r="4.5" fill={palette.white} stroke={palette.kimitoBlue} strokeWidth="2" />
        <Circle cx="152" cy="214" r="4.5" fill={palette.white} stroke={palette.kimitoBlue} strokeWidth="2" />
        <Circle cx="196" cy="184" r="4.5" fill={palette.white} stroke={palette.kimitoBlue} strokeWidth="2" />

        {/* レーダー同心円と精度円 */}
        <Circle cx="240" cy="158" r="126" fill="none" stroke={BLUE_18} strokeWidth="1.2" />
        <Circle cx="240" cy="158" r="86" fill={BLUE_06} stroke={BLUE_18} strokeWidth="1.5" />
        <Circle cx="240" cy="158" r="46" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />

        {/* 十字走査線とスキャンライン */}
        <Line x1="240" y1="22" x2="240" y2="294" stroke={ROAD} strokeWidth="1" />
        <Line x1="94" y1="158" x2="386" y2="158" stroke={ROAD} strokeWidth="1" />
        <Line
          x1="240"
          y1="158"
          x2="338"
          y2="82"
          stroke={palette.kimitoBlue}
          strokeWidth="2.5"
          strokeOpacity="0.5"
        />

        {/* 周辺のすれ違ひシグナル点 */}
        <Circle cx="164" cy="108" r="11" fill={ORANGE_14} />
        <Circle cx="164" cy="108" r="5.5" fill={palette.kimitoOrange} />
        <Circle cx="326" cy="126" r="10" fill={BLUE_10} />
        <Circle cx="326" cy="126" r="5" fill={palette.kimitoBlue} />
        <Circle cx="298" cy="208" r="10" fill={BLUE_10} />
        <Circle cx="298" cy="208" r="5" fill={palette.kimitoBlue} />

        {/* 現在地ピン（オレンジ核＋白縁） */}
        <Circle cx="240" cy="158" r="15" fill={palette.white} />
        <Circle cx="240" cy="158" r="10" fill={palette.kimitoOrange} />
      </Svg>

      {/* 左上: 現在地・測位精度バッジ */}
      <View style={styles.radarPlaceBadge}>
        <MaterialIcons name="my-location" size={14} color={palette.kimitoBlue} />
        <Text style={styles.radarPlaceText} numberOfLines={1}>
          秋葉原電気街・東京都
        </Text>
        <Text style={styles.radarAccuracyText} numberOfLines={1}>
          ±8m
        </Text>
      </View>

      {/* 右上: 未開封のすれ違ひ封筒バッジ */}
      <View style={styles.envelope}>
        <MaterialIcons name="mail" size={15} color={palette.kimitoOrangeText} />
        <Text style={styles.envelopeBadgeText} numberOfLines={1}>
          すれ違ひ 3通
        </Text>
      </View>

      {/* 下部: 受信したすれ違ひシグナルの実感カード（DESIGN.md: 最初の画面は使える画面にする） */}
      <View style={styles.radarBottomCard}>
        <View style={styles.radarSignalRow}>
          <View style={styles.radarSignalIconWrap}>
            <MaterialIcons name="mark-email-unread" size={16} color={palette.kimitoOrangeText} />
          </View>
          <View style={styles.radarSignalBody}>
            <View style={styles.radarSignalTitleRow}>
              <Text style={styles.radarSignalTitle} numberOfLines={1}>
                秋葉原駅 電気街口付近で交差
              </Text>
              <Text style={styles.radarSignalTime}>3分前</Text>
            </View>
            <Text style={styles.radarSignalSub} numberOfLines={1}>
              同セル通過 · タイムシフトすれ違ひ · ±8m
            </Text>
          </View>
        </View>
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
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.kimitoOrange,
  },
  checkinCardOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 64,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  checkinBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkinMetaText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  checkinPlaceTitle: {
    color: palette.kimitoBlue,
    fontSize: 15,
    fontWeight: "800",
  },
  checkinCoordText: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  trailCardOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 64,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  trailBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trailOverlayTitle: {
    color: palette.kimitoBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  trailOverlaySub: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  radarPlaceBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    maxWidth: "62%",
  },
  radarPlaceText: {
    color: palette.kimitoBlue,
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
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
    paddingVertical: 6,
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
  radarBottomCard: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  radarSignalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radarSignalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radarSignalBody: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  radarSignalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  radarSignalTitle: {
    color: color.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  radarSignalTime: {
    color: palette.kimitoOrangeText,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 0,
  },
  radarSignalSub: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "600",
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
