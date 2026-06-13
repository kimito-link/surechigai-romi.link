// components/organisms/tutorial-overlay/previews.tsx
// v6.18: チュートリアルのプレビューコンポーネント
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect, G, Text as SvgText } from "react-native-svg";
import { color, palette } from "@/theme/tokens";

/**
 * 日本地図プレビュー（簡易版）
 */
export function MapPreview() {
  return (
    <View style={styles.container}>
      <Svg width={200} height={150} viewBox="0 0 200 150">
        <G>
          <Circle cx={160} cy={30} r={15} fill={color.balloonLight} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={150} cy={55} r={12} fill={color.balloonLighter} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={145} cy={80} r={18} fill={color.balloonRed} stroke={color.hostAccentLegacy} strokeWidth={2} />
          <Circle cx={125} cy={85} r={14} fill={color.balloonPink} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={105} cy={95} r={16} fill={color.balloonMedium} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={75} cy={100} r={12} fill={color.balloonPale} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={90} cy={115} r={10} fill={color.balloonLighter} stroke={color.hostAccentLegacy} strokeWidth={1} />
          <Circle cx={50} cy={115} r={14} fill={color.balloonPink} stroke={color.hostAccentLegacy} strokeWidth={1} />
        </G>
        <SvgText x={10} y={20} fontSize={10} fill={color.textWhite}>参加者が多い</SvgText>
        <Rect x={10} y={25} width={15} height={8} fill={color.balloonRed} />
        <SvgText x={10} y={50} fontSize={10} fill={color.textWhite}>参加者が少ない</SvgText>
        <Rect x={10} y={55} width={15} height={8} fill={color.balloonPale} />
      </Svg>
      <Text style={styles.caption}>地域別参加者マップ</Text>
    </View>
  );
}

/**
 * 参加者リストプレビュー
 */
export function ParticipantsPreview() {
  const participants = [
    { name: "@fan_user1", followers: "12.5K", badge: "👑" },
    { name: "@supporter_2", followers: "8.2K", badge: "⭐" },
    { name: "@love_oshi", followers: "5.1K", badge: "" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        {participants.map((p, i) => (
          <View key={i} style={styles.listItem}>
            <View style={styles.avatar} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemName}>{p.badge} {p.name}</Text>
              <Text style={styles.listItemSub}>フォロワー {p.followers}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.caption}>参加者リスト</Text>
    </View>
  );
}

/**
 * 男女比グラフプレビュー
 */
export function ChartPreview() {
  return (
    <View style={styles.container}>
      <Svg width={150} height={100} viewBox="0 0 150 100">
        <G transform="translate(75, 50)">
          <Path d="M 0 0 L 40 0 A 40 40 0 0 1 -20 34.6 Z" fill={color.tutorialBlue} />
          <Path d="M 0 0 L -20 34.6 A 40 40 0 1 1 40 0 Z" fill={color.accentPrimary} />
        </G>
        <Rect x={5} y={10} width={12} height={12} fill={color.accentPrimary} />
        <SvgText x={20} y={20} fontSize={10} fill={color.textWhite}>女性 65%</SvgText>
        <Rect x={5} y={30} width={12} height={12} fill={color.tutorialBlue} />
        <SvgText x={20} y={40} fontSize={10} fill={color.textWhite}>男性 35%</SvgText>
      </Svg>
      <Text style={styles.caption}>参加者の男女比</Text>
    </View>
  );
}

/**
 * 通知プレビュー
 */
export function NotificationPreview() {
  return (
    <View style={styles.container}>
      <View style={styles.notificationCard}>
        <Text style={styles.notificationIcon}>🔔</Text>
        <View>
          <Text style={styles.notificationTitle}>新しい参加者！</Text>
          <Text style={styles.notificationBody}>@fan_user1さんが参加表明しました</Text>
        </View>
      </View>
      <Text style={styles.caption}>主催者に通知が届く</Text>
    </View>
  );
}

/**
 * 王冠プレビュー（常連表示）
 */
export function CrownPreview() {
  return (
    <View style={styles.container}>
      <View style={styles.crownContainer}>
        <Text style={styles.crownIcon}>👑</Text>
        <Text style={styles.crownText}>常連ファン</Text>
        <Text style={styles.crownSub}>参加回数: 15回</Text>
      </View>
    </View>
  );
}

/**
 * プレビューコンポーネントの選択
 */
export function PreviewComponent({ type }: { type?: string }) {
  switch (type) {
    case "map":
      return <MapPreview />;
    case "participants":
      return <ParticipantsPreview />;
    case "chart":
      return <ChartPreview />;
    case "notification":
      return <NotificationPreview />;
    case "crown":
      return <CrownPreview />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 16,
    padding: 16,
    minWidth: 220,
  },
  caption: {
    color: palette.white + "B3", // 70% opacity
    fontSize: 11,
    marginTop: 8,
  },
  listContainer: {
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.white + "1A", // 10% opacity
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.hostAccentLegacy,
    marginRight: 10,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  listItemSub: {
    color: palette.white + "99", // 60% opacity
    fontSize: 10,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white + "26", // 15% opacity
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationTitle: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationBody: {
    color: palette.white + "CC", // 80% opacity
    fontSize: 11,
  },
  crownContainer: {
    alignItems: "center",
    padding: 16,
  },
  crownIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  crownText: {
    color: color.rankGold,
    fontSize: 16,
    fontWeight: "bold",
  },
  crownSub: {
    color: palette.white + "B3", // 70% opacity
    fontSize: 12,
    marginTop: 4,
  },
});
