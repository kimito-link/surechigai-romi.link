import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Line, Path, Polyline, Rect } from "react-native-svg";
import MaterialIcons from "@/lib/icons/material-icons";
import { color, palette } from "@/theme/tokens";

const BLUE_10 = `${palette.kimitoBlue}1A`;
const BLUE_18 = `${palette.kimitoBlue}2E`;
const BLUE_45 = `${palette.kimitoBlue}73`;
const ROAD = palette.kimitoBorderSoft;

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return <View style={styles.frame}>{children}</View>;
}

function RoadGrid({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <PreviewFrame>
      <Svg width="100%" height="100%" viewBox="0 0 328 210">
        <Rect x="0" y="0" width="328" height="210" fill={palette.white} />
        <Line x1="22" y1="0" x2="92" y2="210" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="142" y1="0" x2="118" y2="210" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="224" y1="0" x2="264" y2="210" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="44" x2="328" y2="20" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="110" x2="328" y2="122" stroke={ROAD} strokeWidth="1.5" />
        <Line x1="0" y1="178" x2="328" y2="156" stroke={ROAD} strokeWidth="1.5" />
        {children}
      </Svg>
      {overlay}
    </PreviewFrame>
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
      <Circle cx="148" cy="106" r="60" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Path
        d="M148 54c-17 0-31 13-31 30 0 22 31 58 31 58s31-36 31-58c0-17-14-30-31-30z"
        fill={palette.kimitoBlue}
      />
      <Circle cx="148" cy="84" r="10" fill={palette.white} />
      <Rect x="166" y="52" width="86" height="30" rx="6" fill={palette.white} stroke={ROAD} strokeWidth="1" />
    </RoadGrid>
  );
}

export function TrailGuestPreview() {
  return (
    <RoadGrid
      overlay={<Text style={[styles.previewChip, styles.trailTime]}>09:18</Text>}
    >
      <Polyline
        points="64,156 118,128 162,88 222,102 270,64"
        fill="none"
        stroke={palette.kimitoBlue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[64, 118, 162, 222].map((x, idx) => (
        <Circle
          key={x}
          cx={x}
          cy={[156, 128, 88, 102][idx]}
          r="5"
          fill={palette.white}
          stroke={palette.kimitoBlue}
          strokeWidth="2"
        />
      ))}
      <Circle cx="270" cy="64" r="40" fill={BLUE_10} stroke={BLUE_45} strokeWidth="1.5" />
      <Circle cx="270" cy="64" r="6" fill={palette.kimitoOrange} />
      <Rect x="178" y="30" width="74" height="28" rx="6" fill={palette.white} stroke={ROAD} strokeWidth="1" />
    </RoadGrid>
  );
}

export function RadarGuestPreview() {
  return (
    <PreviewFrame>
      <Svg width="100%" height="100%" viewBox="0 0 328 210">
        <Rect x="0" y="0" width="328" height="210" fill={palette.white} />
        <Circle cx="164" cy="96" r="32" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Circle cx="164" cy="96" r="64" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Circle cx="164" cy="96" r="96" fill="none" stroke={BLUE_18} strokeWidth="2" />
        <Line x1="164" y1="0" x2="164" y2="192" stroke={ROAD} strokeWidth="1" />
        <Line x1="42" y1="96" x2="286" y2="96" stroke={ROAD} strokeWidth="1" />
        <Circle cx="164" cy="96" r="8" fill={palette.kimitoOrange} />
      </Svg>
      <View style={styles.envelope}>
        <MaterialIcons name="mail-outline" size={24} color={palette.kimitoBlue} />
      </View>
      <Text style={styles.radarCaption}>封筒が届くかも</Text>
    </PreviewFrame>
  );
}

export function ZukanGuestPreview() {
  const cells = [
    [null, null, null, null, null, null, "北"],
    [null, null, null, null, null, "青", "岩"],
    [null, null, null, null, "新", "福", null],
    [null, null, null, "石", "長", "東", "千"],
    [null, "山", "島", "兵", "京", "静", null],
    ["長", "福", null, "愛", "香", null, null],
    [null, "鹿", "宮", null, null, null, null],
    ["沖", null, null, null, null, null, null],
  ];
  const active = new Set(["東", "福", "京", "北"]);

  return (
    <PreviewFrame>
      <View style={styles.japanGrid}>
        {cells.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.japanRow}>
            {row.map((cell, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.japanCell,
                  !cell && styles.japanCellEmpty,
                  cell && active.has(cell) && styles.japanCellActive,
                  cell === "東" && styles.japanCellHot,
                ]}
              >
                {cell ? <Text style={styles.japanCellText}>{cell}</Text> : null}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.zukanDot} />
      <View style={styles.zukanChip}>
        <Text style={styles.zukanChipText}>例: いま 3 人</Text>
      </View>
    </PreviewFrame>
  );
}

export function MypageGuestPreview() {
  return (
    <PreviewFrame>
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
    </PreviewFrame>
  );
}

export function EventsGuestPreview() {
  return null;
}

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    height: 210,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    overflow: "hidden",
    position: "relative",
  },
  previewChip: {
    position: "absolute",
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  previewPlace: {
    position: "absolute",
    color: palette.kimitoBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  checkinTime: {
    left: "52%",
    top: 58,
  },
  checkinPlace: {
    left: 18,
    bottom: 16,
  },
  trailTime: {
    left: "58%",
    top: 36,
  },
  envelope: {
    position: "absolute",
    top: 48,
    right: 56,
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
    bottom: 18,
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  japanGrid: {
    alignSelf: "center",
    marginTop: 22,
    gap: 3,
  },
  japanRow: {
    flexDirection: "row",
    gap: 3,
  },
  japanCell: {
    width: 26,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  japanCellEmpty: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  japanCellActive: {
    backgroundColor: `${palette.kimitoBlue}66`,
    borderColor: palette.kimitoBlue,
  },
  japanCellHot: {
    backgroundColor: palette.kimitoBlue,
  },
  japanCellText: {
    color: color.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },
  zukanDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    left: "58%",
    top: "47%",
    backgroundColor: palette.kimitoOrange,
    borderWidth: 2,
    borderColor: palette.white,
  },
  zukanChip: {
    position: "absolute",
    right: 24,
    bottom: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    backgroundColor: palette.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  zukanChipText: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  profileMock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 28,
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
