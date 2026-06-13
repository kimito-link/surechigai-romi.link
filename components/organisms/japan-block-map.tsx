/**
 * JapanBlockMap - 47都道府県ブロック表示の日本地図
 * v6.27: 都道府県別ブロック配置、タップ機能、ヒートマップ表示
 */
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { useMemo, useCallback } from "react";

const screenWidth = Dimensions.get("window").width;

interface JapanBlockMapProps {
  prefectureCounts: { [key: string]: number };
  onPrefecturePress?: (prefecture: string) => void;
  onRegionPress?: (regionName: string, prefectures: string[]) => void;
}

// 地域ごとの色設定
const regionColors = {
  "北海道": { bg: palette.regionHokkaido, text: palette.blue600, border: palette.borderHokkaido },
  "東北": { bg: palette.regionTohoku, text: palette.green600, border: palette.borderTohoku },
  "関東": { bg: palette.regionKanto, text: palette.green600, border: palette.borderKanto },
  "中部": { bg: palette.regionChubu, text: palette.accent600, border: palette.borderChubu },
  "関西": { bg: palette.regionKansai, text: palette.pink600, border: palette.borderKansai },
  "中国": { bg: palette.regionChugoku, text: palette.teal600, border: palette.borderChugoku },
  "四国": { bg: palette.regionShikoku, text: palette.gold, border: palette.borderShikoku },
  "九州・沖縄": { bg: palette.regionKyushuOkinawa, text: palette.red600, border: palette.borderKyushu },
};

// 47都道府県データ（地域別）
const prefectureData = {
  "北海道": [
    { name: "北海道", short: "北海道", code: "01" },
  ],
  "東北": [
    { name: "青森県", short: "青森", code: "02" },
    { name: "岩手県", short: "岩手", code: "03" },
    { name: "宮城県", short: "宮城", code: "04" },
    { name: "秋田県", short: "秋田", code: "05" },
    { name: "山形県", short: "山形", code: "06" },
    { name: "福島県", short: "福島", code: "07" },
  ],
  "関東": [
    { name: "茨城県", short: "茨城", code: "08" },
    { name: "栃木県", short: "栃木", code: "09" },
    { name: "群馬県", short: "群馬", code: "10" },
    { name: "埼玉県", short: "埼玉", code: "11" },
    { name: "千葉県", short: "千葉", code: "12" },
    { name: "東京都", short: "東京", code: "13" },
    { name: "神奈川県", short: "神奈川", code: "14" },
  ],
  "中部": [
    { name: "新潟県", short: "新潟", code: "15" },
    { name: "富山県", short: "富山", code: "16" },
    { name: "石川県", short: "石川", code: "17" },
    { name: "福井県", short: "福井", code: "18" },
    { name: "山梨県", short: "山梨", code: "19" },
    { name: "長野県", short: "長野", code: "20" },
    { name: "岐阜県", short: "岐阜", code: "21" },
    { name: "静岡県", short: "静岡", code: "22" },
    { name: "愛知県", short: "愛知", code: "23" },
  ],
  "関西": [
    { name: "三重県", short: "三重", code: "24" },
    { name: "滋賀県", short: "滋賀", code: "25" },
    { name: "京都府", short: "京都", code: "26" },
    { name: "大阪府", short: "大阪", code: "27" },
    { name: "兵庫県", short: "兵庫", code: "28" },
    { name: "奈良県", short: "奈良", code: "29" },
    { name: "和歌山県", short: "和歌山", code: "30" },
  ],
  "中国": [
    { name: "鳥取県", short: "鳥取", code: "31" },
    { name: "島根県", short: "島根", code: "32" },
    { name: "岡山県", short: "岡山", code: "33" },
    { name: "広島県", short: "広島", code: "34" },
    { name: "山口県", short: "山口", code: "35" },
  ],
  "四国": [
    { name: "徳島県", short: "徳島", code: "36" },
    { name: "香川県", short: "香川", code: "37" },
    { name: "愛媛県", short: "愛媛", code: "38" },
    { name: "高知県", short: "高知", code: "39" },
  ],
  "九州・沖縄": [
    { name: "福岡県", short: "福岡", code: "40" },
    { name: "佐賀県", short: "佐賀", code: "41" },
    { name: "長崎県", short: "長崎", code: "42" },
    { name: "熊本県", short: "熊本", code: "43" },
    { name: "大分県", short: "大分", code: "44" },
    { name: "宮崎県", short: "宮崎", code: "45" },
    { name: "鹿児島県", short: "鹿児島", code: "46" },
    { name: "沖縄県", short: "沖縄", code: "47" },
  ],
};

// 地域名の配列
const regionNames = Object.keys(prefectureData) as (keyof typeof prefectureData)[];

function JapanBlockMapInner({ prefectureCounts, onPrefecturePress, onRegionPress }: JapanBlockMapProps) {
  // 都道府県のカウントを取得
  const getCount = useCallback((prefName: string, shortName: string) => {
    return prefectureCounts[prefName] || prefectureCounts[shortName] || 0;
  }, [prefectureCounts]);

  // 統計情報を計算
  const stats = useMemo(() => {
    const totalPrefectures = Object.keys(prefectureCounts).filter(k => prefectureCounts[k] > 0).length;
    const totalParticipants = Object.values(prefectureCounts).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(prefectureCounts), 0);
    
    // 最も参加者が多い都道府県を探す
    let hotPrefecture = "";
    for (const region of regionNames) {
      for (const pref of prefectureData[region]) {
        const count = getCount(pref.name, pref.short);
        if (count === maxCount && maxCount > 0) {
          hotPrefecture = pref.short;
          break;
        }
      }
      if (hotPrefecture) break;
    }
    
    return { totalPrefectures, totalParticipants, maxCount, hotPrefecture };
  }, [prefectureCounts, getCount]);

  // 地域ごとの合計を計算
  const regionTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    for (const region of regionNames) {
      totals[region] = prefectureData[region].reduce((sum, pref) => {
        return sum + getCount(pref.name, pref.short);
      }, 0);
    }
    return totals;
  }, [getCount]);

  // 透明度を16進数に変換するヘルパー関数
  const opacityToHex = (opacity: number): string => {
    const hex = Math.round(opacity * 255).toString(16).padStart(2, "0").toUpperCase();
    return hex;
  };

  // ヒートマップの色を計算
  const getHeatColor = (count: number) => {
    if (count === 0) return "transparent";
    const intensity = Math.min(count / Math.max(stats.maxCount, 1), 1);
    const alpha = 0.3 + intensity * 0.7;
    return palette.red500 + opacityToHex(alpha); // 赤のグラデーション
  };

  // 都道府県ブロックをレンダリング
  const renderPrefectureBlock = (
    pref: { name: string; short: string; code: string },
    regionName: string,
    index: number
  ) => {
    const count = getCount(pref.name, pref.short);
    const regionColor = regionColors[regionName as keyof typeof regionColors];
    const heatColor = getHeatColor(count);
    const isHot = count === stats.maxCount && count > 0;

    return (
      <Pressable
        key={pref.code}
        style={({ pressed }) => [
          styles.prefectureBlock,
          { 
            backgroundColor: regionColor.bg,
            borderColor: count > 0 ? regionColor.border : "transparent",
            borderWidth: count > 0 ? 2 : 0,
          },
          pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPrefecturePress?.(pref.name);
        }}
      >
        {/* ヒートマップオーバーレイ */}
        {count > 0 && (
          <View style={[styles.heatOverlay, { backgroundColor: heatColor }]} />
        )}
        
        <Text style={[styles.prefectureName, { color: regionColor.text }]} numberOfLines={1}>
          {pref.short}
        </Text>
        <Text style={[styles.prefectureCount, { color: regionColor.text }]}>
          {count > 0 ? count : "-"}
        </Text>
        
        {/* 最多マーク */}
        {isHot && (
          <View style={styles.hotBadge}>
            <Text style={{ fontSize: 10 }}>🔥</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // 地域セクションをレンダリング
  const renderRegionSection = (regionName: keyof typeof prefectureData) => {
    const regionColor = regionColors[regionName as keyof typeof regionColors];
    const total = regionTotals[regionName];
    const prefectures = prefectureData[regionName];
    const prefectureNames = prefectures.map(p => p.name);

    return (
      <View key={regionName} style={styles.regionSection}>
        {/* 地域ヘッダー */}
        <Pressable
          style={({ pressed }) => [
            styles.regionHeader,
            { backgroundColor: regionColor.bg },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRegionPress?.(regionName, prefectureNames);
          }}
        >
          <Text style={[styles.regionTitle, { color: regionColor.text }]}>{regionName}</Text>
          <Text style={[styles.regionTotal, { color: regionColor.text }]}>
            {total > 0 ? `${total}人` : "-"}
          </Text>
        </Pressable>

        {/* 都道府県グリッド */}
        <View style={styles.prefectureGrid}>
          {prefectures.map((pref, index) => renderPrefectureBlock(pref, regionName, index))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>🗾 地域別参加者マップ</Text>
        <Text style={styles.subtitle}>合計 {stats.totalParticipants}人</Text>
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

      {/* 地域別マップ */}
      <ScrollView 
        style={styles.mapScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.mapContainer}>
          {regionNames.map(regionName => renderRegionSection(regionName))}
        </View>
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>タップで詳細を表示</Text>
        <View style={styles.legendItems}>
          {Object.entries(regionColors).map(([name, colors]) => (
            <View key={name} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.bg }]} />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * JapanBlockMap - エラーバウンダリでラップされたメインコンポーネント
 */
export function JapanBlockMap(props: JapanBlockMapProps) {
  return (
    <MapErrorBoundary mapType="block" height={600}>
      <JapanBlockMapInner {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: color.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: color.textSubtle,
  },
  hotHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.red400 + "26", // 15% opacity
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.red400 + "4D", // 30% opacity
  },
  hotIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  hotTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.coral,
  },
  hotSubtitle: {
    fontSize: 11,
    color: color.textSecondary,
  },
  mapScrollView: {
    maxHeight: 400,
  },
  mapContainer: {
    gap: 12,
  },
  regionSection: {
    marginBottom: 8,
  },
  regionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  regionTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  regionTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  prefectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 4,
  },
  prefectureBlock: {
    width: (screenWidth - 80) / 5,
    minWidth: 54,
    maxWidth: 70,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  heatOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  prefectureName: {
    fontSize: 10,
    fontWeight: "600",
    zIndex: 1,
  },
  prefectureCount: {
    fontSize: 12,
    fontWeight: "bold",
    zIndex: 1,
  },
  hotBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    zIndex: 2,
  },
  legend: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  legendTitle: {
    fontSize: 11,
    color: color.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
