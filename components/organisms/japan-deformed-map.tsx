import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { useMemo } from "react";

interface JapanDeformedMapProps {
  prefectureCounts: { [key: string]: number };
  onPrefecturePress?: (prefecture: string) => void;
  onRegionPress?: (regionName: string, prefectures: string[]) => void;
}

// 地域ごとの色設定（より鮮やかな色）
const regionColors: { [key: string]: { bg: string; text: string; border: string } } = {
  "北海道": { bg: color.regionHokkaido, text: color.textPrimary, border: color.borderHokkaido },
  "東北": { bg: color.regionTohoku, text: color.textPrimary, border: color.borderTohoku },
  "関東": { bg: color.regionKanto, text: color.textPrimary, border: color.borderKanto },
  "中部": { bg: color.regionChubu, text: color.textPrimary, border: color.borderChubu },
  "関西": { bg: color.regionKansai, text: color.textPrimary, border: color.borderKansai },
  "中国": { bg: color.regionChugoku, text: color.textPrimary, border: color.borderChugoku },
  "四国": { bg: color.regionShikoku, text: color.textPrimary, border: color.borderShikoku },
  "九州": { bg: color.regionKyushu, text: color.textWhite, border: color.borderKyushu },
  "沖縄": { bg: color.regionOkinawa, text: color.textPrimary, border: color.borderOkinawa },
};

// 47都道府県のデータ（参考画像に近いグリッド配置）
// 横に広がる日本地図の形を再現
const prefectureData: { name: string; short: string; region: string; row: number; col: number }[] = [
  // 北海道（右上）
  { name: "北海道", short: "北海道", region: "北海道", row: 0, col: 10 },
  
  // 東北（右側）
  { name: "青森県", short: "青森", region: "東北", row: 1, col: 10 },
  { name: "秋田県", short: "秋田", region: "東北", row: 2, col: 9 },
  { name: "岩手県", short: "岩手", region: "東北", row: 2, col: 10 },
  { name: "山形県", short: "山形", region: "東北", row: 3, col: 9 },
  { name: "宮城県", short: "宮城", region: "東北", row: 3, col: 10 },
  { name: "福島県", short: "福島", region: "東北", row: 4, col: 9 },
  
  // 関東（右側中央）
  { name: "新潟県", short: "新潟", region: "中部", row: 4, col: 8 },
  { name: "群馬県", short: "群馬", region: "関東", row: 5, col: 8 },
  { name: "栃木県", short: "栃木", region: "関東", row: 5, col: 9 },
  { name: "茨城県", short: "茨城", region: "関東", row: 5, col: 10 },
  { name: "埼玉県", short: "埼玉", region: "関東", row: 6, col: 8 },
  { name: "東京都", short: "東京", region: "関東", row: 6, col: 9 },
  { name: "千葉県", short: "千葉", region: "関東", row: 6, col: 10 },
  { name: "神奈川県", short: "神奈川", region: "関東", row: 7, col: 9 },
  
  // 中部（中央）
  { name: "山梨県", short: "山梨", region: "中部", row: 7, col: 8 },
  { name: "長野県", short: "長野", region: "中部", row: 6, col: 7 },
  { name: "富山県", short: "富山", region: "中部", row: 5, col: 6 },
  { name: "石川県", short: "石川", region: "中部", row: 4, col: 6 },
  { name: "福井県", short: "福井", region: "中部", row: 5, col: 5 },
  { name: "岐阜県", short: "岐阜", region: "中部", row: 6, col: 6 },
  { name: "静岡県", short: "静岡", region: "中部", row: 7, col: 7 },
  { name: "愛知県", short: "愛知", region: "中部", row: 7, col: 6 },
  
  // 関西（中央左）
  { name: "三重県", short: "三重", region: "関西", row: 7, col: 5 },
  { name: "滋賀県", short: "滋賀", region: "関西", row: 6, col: 5 },
  { name: "京都府", short: "京都", region: "関西", row: 6, col: 4 },
  { name: "大阪府", short: "大阪", region: "関西", row: 7, col: 4 },
  { name: "兵庫県", short: "兵庫", region: "関西", row: 7, col: 3 },
  { name: "奈良県", short: "奈良", region: "関西", row: 8, col: 4 },
  { name: "和歌山県", short: "和歌山", region: "関西", row: 8, col: 5 },
  
  // 中国（左側）
  { name: "鳥取県", short: "鳥取", region: "中国", row: 6, col: 3 },
  { name: "島根県", short: "島根", region: "中国", row: 6, col: 2 },
  { name: "岡山県", short: "岡山", region: "中国", row: 7, col: 2 },
  { name: "広島県", short: "広島", region: "中国", row: 8, col: 2 },
  { name: "山口県", short: "山口", region: "中国", row: 8, col: 1 },
  
  // 四国（左下）
  { name: "徳島県", short: "徳島", region: "四国", row: 8, col: 3 },
  { name: "香川県", short: "香川", region: "四国", row: 9, col: 3 },
  { name: "愛媛県", short: "愛媛", region: "四国", row: 9, col: 2 },
  { name: "高知県", short: "高知", region: "四国", row: 10, col: 2 },
  
  // 九州（左下）
  { name: "福岡県", short: "福岡", region: "九州", row: 9, col: 1 },
  { name: "佐賀県", short: "佐賀", region: "九州", row: 10, col: 1 },
  { name: "長崎県", short: "長崎", region: "九州", row: 10, col: 0 },
  { name: "熊本県", short: "熊本", region: "九州", row: 11, col: 1 },
  { name: "大分県", short: "大分", region: "九州", row: 9, col: 0 },
  { name: "宮崎県", short: "宮崎", region: "九州", row: 11, col: 0 },
  { name: "鹿児島県", short: "鹿児島", region: "九州", row: 12, col: 1 },
  
  // 沖縄（最下部）
  { name: "沖縄県", short: "沖縄", region: "沖縄", row: 12, col: 0 },
];

// 参加者数に応じた動的アイコン
function getParticipantIcon(count: number): string {
  if (count === 0) return "😢";
  if (count <= 5) return "😊";
  if (count <= 20) return "🔥";
  return "🎉";
}

// 参加者数に応じた色の濃さを計算
// 参加者がいない場合は灰色、参加者が多いほど赤くなる
function getHeatColor(count: number, maxCount: number, baseColor: { bg: string; text: string; border: string }) {
  if (count === 0) {
    // 参加者がいない場合は灰色
    return { bg: color.mapInactive, text: color.textMuted, border: color.border, hasParticipants: false };
  }
  
  // 参加者がいる場合は赤系の色に（参加者数に応じて濃くなる）
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  
  if (intensity >= 0.8) {
    // 最も参加者が多い（濃い赤）
    return { bg: color.heatIntense5, text: color.textWhite, border: color.heatIntenseBorder5, hasParticipants: true };
  } else if (intensity >= 0.6) {
    // 参加者が多い（赤）
    return { bg: color.heatIntense4, text: color.textWhite, border: color.heatIntense5, hasParticipants: true };
  } else if (intensity >= 0.4) {
    // 参加者が中程度（オレンジ赤）
    return { bg: color.heatIntense3, text: color.textWhite, border: color.heatIntense4, hasParticipants: true };
  } else if (intensity >= 0.2) {
    // 参加者が少なめ（オレンジ）
    return { bg: color.heatIntense2, text: color.textWhite, border: color.borderOkinawa, hasParticipants: true };
  }
  
  // 参加者が少ない（薄いオレンジ）
  return { bg: color.heatIntense1, text: color.textWhite, border: color.heatIntenseBorder1, hasParticipants: true };
}

// レスポンシブブレークポイント（8段階）
function getResponsiveConfig(width: number) {
  // 最小タップエリア44px以上を保証
  const MIN_TAP_SIZE = 44;
  
  if (width < 320) {
    // 超小型（280px〜319px）
    return { cellSize: MIN_TAP_SIZE, fontSize: 8, countSize: 9, gap: 1, padding: 8 };
  } else if (width < 375) {
    // 小型（320px〜374px）
    return { cellSize: MIN_TAP_SIZE, fontSize: 9, countSize: 10, gap: 1, padding: 12 };
  } else if (width < 414) {
    // 標準（375px〜413px）
    return { cellSize: 46, fontSize: 10, countSize: 11, gap: 2, padding: 16 };
  } else if (width < 768) {
    // 大型スマホ（414px〜767px）
    return { cellSize: 48, fontSize: 11, countSize: 12, gap: 2, padding: 16 };
  } else if (width < 1024) {
    // タブレット（768px〜1023px）
    return { cellSize: 56, fontSize: 12, countSize: 14, gap: 3, padding: 20 };
  } else if (width < 1440) {
    // 小型PC（1024px〜1439px）
    return { cellSize: 64, fontSize: 14, countSize: 16, gap: 4, padding: 24 };
  } else if (width < 2560) {
    // 大型PC（1440px〜2559px）
    return { cellSize: 72, fontSize: 16, countSize: 18, gap: 4, padding: 28 };
  } else {
    // 4K（2560px以上）
    return { cellSize: 80, fontSize: 18, countSize: 20, gap: 5, padding: 32 };
  }
}

function JapanDeformedMapInner({ prefectureCounts, onPrefecturePress, onRegionPress }: JapanDeformedMapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const config = getResponsiveConfig(screenWidth);
  
  // 統計情報を計算
  const stats = useMemo(() => {
    const totalPrefectures = Object.keys(prefectureCounts).filter(k => prefectureCounts[k] > 0).length;
    const totalParticipants = Object.values(prefectureCounts).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(prefectureCounts), 0);
    const hotPrefecture = Object.entries(prefectureCounts).find(([_, count]) => count === maxCount)?.[0] || "";
    
    return { totalPrefectures, totalParticipants, maxCount, hotPrefecture };
  }, [prefectureCounts]);

  // グリッドの範囲を計算
  const gridBounds = useMemo(() => {
    const rows = prefectureData.map(p => p.row);
    const cols = prefectureData.map(p => p.col);
    return {
      minRow: Math.min(...rows),
      maxRow: Math.max(...rows),
      minCol: Math.min(...cols),
      maxCol: Math.max(...cols),
    };
  }, []);

  // セルサイズを画面幅に合わせて計算（最小44px以上を保証、PC画面では最大800pxに制限）
  const numCols = gridBounds.maxCol - gridBounds.minCol + 1;
  const maxContainerWidth = Math.min(screenWidth - (config.padding * 2), 800);
  const calculatedCellSize = Math.floor(maxContainerWidth / numCols) - config.gap;
  const cellSize = Math.max(calculatedCellSize, config.cellSize);
  const mapWidth = numCols * (cellSize + config.gap);
  const mapHeight = (gridBounds.maxRow - gridBounds.minRow + 1) * (cellSize + config.gap) + 20;

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🗾 地域別参加者マップ</Text>
        <Text style={styles.subtitle}>合計 {stats.totalParticipants}人</Text>
      </View>

      {/* デフォルメ日本地図 */}
      <View style={[styles.mapContainer, { height: mapHeight, width: mapWidth }]}>
        {prefectureData.map((pref) => {
          const count = prefectureCounts[pref.name] || prefectureCounts[pref.short] || 0;
          const baseColor = regionColors[pref.region] || regionColors["関東"];
          const color = getHeatColor(count, stats.maxCount, baseColor);
          const icon = getParticipantIcon(count);
          
          const top = (pref.row - gridBounds.minRow) * (cellSize + config.gap);
          const left = (pref.col - gridBounds.minCol) * (cellSize + config.gap);
          
          // 都道府県名を短縮（2文字以内）
          let displayName = pref.short.replace("県", "").replace("府", "").replace("都", "");
          if (displayName === "北海道") displayName = "北海";
          if (displayName === "神奈川") displayName = "神奈";
          if (displayName === "和歌山") displayName = "和歌";
          if (displayName === "鹿児島") displayName = "鹿児";
          
          return (
            <Pressable
              key={pref.name}
              style={({ pressed }) => [
                styles.prefectureCell,
                {
                  width: cellSize,
                  height: cellSize,
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: color.bg,
                  borderColor: color.hasParticipants ? palette.white : color.border,
                  borderWidth: color.hasParticipants ? 2 : 1,
                  position: "absolute",
                  top,
                  left,
                  shadowColor: color.hasParticipants ? palette.red500 : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: color.hasParticipants ? 0.8 : 0,
                  shadowRadius: 4,
                  elevation: color.hasParticipants ? 5 : 0,
                },
                pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPrefecturePress?.(pref.name);
              }}
              accessibilityLabel={`${pref.name}: ${count}人参加`}
              accessibilityRole="button"
              accessibilityHint="タップすると参加者一覧を表示します"
            >
              {/* アイコン表示 */}
              <Text style={{ fontSize: config.countSize }}>{icon}</Text>
              <Text 
                style={[
                  styles.prefectureName, 
                  { 
                    color: color.text, 
                    fontSize: config.fontSize,
                    fontWeight: color.hasParticipants ? "bold" : "600",
                  }
                ]} 
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {count > 0 && (
                <Text 
                  style={[
                    styles.prefectureCount, 
                    { 
                      color: color.text, 
                      fontSize: config.countSize,
                      fontWeight: "bold",
                    }
                  ]}
                >
                  {count}人
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 統計サマリー */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPrefectures}</Text>
          <Text style={styles.statLabel}>都道府県</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalParticipants}</Text>
          <Text style={styles.statLabel}>総参加者</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.maxCount}</Text>
          <Text style={styles.statLabel}>最多</Text>
        </View>
      </View>

      {/* 熱い地域ハイライト */}
      {stats.hotPrefecture && stats.maxCount > 0 && (
        <View style={styles.hotHighlight}>
          <Text style={styles.hotIcon}>🔥</Text>
          <View>
            <Text style={styles.hotTitle}>{stats.hotPrefecture}が熱い！</Text>
            <Text style={styles.hotSubtitle}>{stats.maxCount}人が参加表明中</Text>
          </View>
        </View>
      )}

      {/* アイコン凡例 */}
      <View style={styles.iconLegend}>
        <Text style={styles.legendTitle}>参加者数アイコン</Text>
        <View style={styles.iconLegendItems}>
          <View style={styles.iconLegendItem}>
            <Text style={styles.iconLegendEmoji}>😢</Text>
            <Text style={styles.iconLegendText}>0人</Text>
          </View>
          <View style={styles.iconLegendItem}>
            <Text style={styles.iconLegendEmoji}>😊</Text>
            <Text style={styles.iconLegendText}>1〜5人</Text>
          </View>
          <View style={styles.iconLegendItem}>
            <Text style={styles.iconLegendEmoji}>🔥</Text>
            <Text style={styles.iconLegendText}>6〜20人</Text>
          </View>
          <View style={styles.iconLegendItem}>
            <Text style={styles.iconLegendEmoji}>🎉</Text>
            <Text style={styles.iconLegendText}>21人〜</Text>
          </View>
        </View>
      </View>

      {/* 地域カラー凡例 */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>地域カラー</Text>
        <View style={styles.legendItems}>
          {Object.entries(regionColors).map(([name, color]) => (
            <View key={name} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: color.bg }]} />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * JapanDeformedMap - エラーバウンダリでラップされたメインコンポーネント
 */
export function JapanDeformedMap(props: JapanDeformedMapProps) {
  return (
    <MapErrorBoundary mapType="deformed" height={500}>
      <JapanDeformedMapInner {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: color.textSecondary,
  },
  mapContainer: {
    position: "relative",
    marginBottom: 16,
    alignSelf: "center",
    width: "100%",
    maxWidth: 800,
  },
  prefectureCell: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  prefectureName: {
    textAlign: "center",
    marginTop: -2,
  },
  prefectureCount: {
    marginTop: -2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: color.textSubtle,
  },
  hotHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.red400 + "26", // 15% opacity
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.red400 + "4D", // 30% opacity
  },
  hotIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  hotTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.coral,
  },
  hotSubtitle: {
    fontSize: 12,
    color: color.textSecondary,
  },
  iconLegend: {
    marginBottom: 12,
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 12,
  },
  iconLegendItems: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  iconLegendItem: {
    alignItems: "center",
  },
  iconLegendEmoji: {
    fontSize: 20,
  },
  iconLegendText: {
    fontSize: 10,
    color: color.textSecondary,
    marginTop: 4,
  },
  legend: {
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 12,
    color: color.textSecondary,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: color.textSecondary,
  },
});
