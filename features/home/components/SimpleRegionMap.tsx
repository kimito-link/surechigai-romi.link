// features/home/components/SimpleRegionMap.tsx
// v6.17: ホーム用簡易地域マップ（6ブロック、コンパクト表示）
import { View, Text, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { homeText, homeUI, homeFont } from "@/features/home/ui/theme/tokens";
import { regions } from "@/components/organisms/japan-region/region-data";

type RegionCount = {
  regionId: string;
  count: number;
};

type Props = {
  /** 地域ごとの参加者数 */
  regionCounts?: RegionCount[];
  /** 合計参加者数 */
  totalCount?: number;
  /** タップ時のコールバック */
  onPress?: () => void;
  /** チャレンジIDを渡す場合（詳細画面への遷移用） */
  challengeId?: number;
};

export function SimpleRegionMap({ regionCounts = [], totalCount = 0, onPress, challengeId }: Props) {
  const colors = useColors();

  // 地域ごとの参加者数をマップに変換
  const countMap = new Map(regionCounts.map(r => [r.regionId, r.count]));
  
  // 最大値を取得（色の濃さ計算用）
  const maxCount = Math.max(...regionCounts.map(r => r.count), 1);

  // 地域を2行に分割（上段: 北海道東北、関東、中部 / 下段: 関西、中国四国、九州沖縄）
  const topRow = regions.slice(0, 3);
  const bottomRow = regions.slice(3, 6);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: colors.surface,
          borderColor: homeUI.border,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <MaterialIcons name="map" size={18} color={homeText.accent} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          🗾 全国から{" "}
          <Text style={styles.totalCount}>{totalCount.toLocaleString()}</Text>
          人 参加中！
        </Text>
      </View>

      {/* 6ブロックグリッド */}
      <View style={styles.grid}>
        {/* 上段 */}
        <View style={styles.row}>
          {topRow.map((region) => {
            const count = countMap.get(region.id) || 0;
            const intensity = count / maxCount;
            return (
              <RegionBlock
                key={region.id}
                emoji={region.emoji}
                name={region.shortName.replace("\n", "")}
                count={count}
                color={region.color}
                intensity={intensity}
              />
            );
          })}
        </View>
        {/* 下段 */}
        <View style={styles.row}>
          {bottomRow.map((region) => {
            const count = countMap.get(region.id) || 0;
            const intensity = count / maxCount;
            return (
              <RegionBlock
                key={region.id}
                emoji={region.emoji}
                name={region.shortName.replace("\n", "")}
                count={count}
                color={region.color}
                intensity={intensity}
              />
            );
          })}
        </View>
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: homeText.muted }]}>
          タップで詳細を見る
        </Text>
        <MaterialIcons name="chevron-right" size={16} color={homeText.muted} />
      </View>
    </Pressable>
  );
}

// 個別の地域ブロック
function RegionBlock({
  emoji,
  name,
  count,
  color,
  intensity,
}: {
  emoji: string;
  name: string;
  count: number;
  color: string;
  intensity: number;
}) {
  // 参加者がいる場合は色を濃くする
  const bgOpacity = count > 0 ? 0.15 + intensity * 0.35 : 0.08;
  const backgroundColor = color + Math.round(bgOpacity * 255).toString(16).padStart(2, "0");

  return (
    <View style={[styles.block, { backgroundColor }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.regionName}>{name}</Text>
      <Text style={[styles.count, count > 0 && styles.countActive]}>
        {count > 0 ? `${count}人` : "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: homeFont.body,
    fontWeight: "600",
  },
  totalCount: {
    fontSize: homeFont.lg,
    fontWeight: "bold",
    color: homeText.accent,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  block: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    minHeight: 60,
  },
  emoji: {
    fontSize: homeFont.title,
    marginBottom: 2,
  },
  regionName: {
    fontSize: homeFont.meta,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  count: {
    fontSize: homeFont.meta,
    color: "#999",
    marginTop: 2,
  },
  countActive: {
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 4,
  },
  footerText: {
    fontSize: homeFont.meta,
  },
});
