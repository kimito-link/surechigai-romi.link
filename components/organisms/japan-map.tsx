import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { MapErrorBoundary } from "@/components/ui/map-error-boundary";
import { useMemo } from "react";

// 透明度を16進数に変換するヘルパー関数
function opacityToHex(opacity: number): string {
  const hex = Math.round(opacity * 255).toString(16).padStart(2, "0").toUpperCase();
  return hex;
}


// 地図用地域グループ（北海道・東北が分離、近畿は「関西」表記、色付き）
const regionGroups = [
  { name: "北海道", prefectures: ["北海道"], color: color.blue400 },
  { name: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"], color: color.info },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"], color: color.pink400 },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"], color: color.emerald400 },
  { name: "関西", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"], color: palette.amber400 },
  { name: "中国・四国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"], color: color.purple400 },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"], color: color.orange400 },
];

interface PrefectureCount {
  [prefecture: string]: number;
}

interface JapanMapProps {
  prefectureCounts: PrefectureCount;
  onPrefecturePress?: (prefecture: string) => void;
  selectedPrefecture?: string | null;
}

function JapanMapInner({ prefectureCounts, onPrefecturePress, selectedPrefecture }: JapanMapProps) {
  // 地域ごとの参加者数を集計
  const regionCounts = useMemo(() => {
    const counts: { [region: string]: number } = {};
    regionGroups.forEach(region => {
      counts[region.name] = region.prefectures.reduce((sum, pref) => sum + (prefectureCounts[pref] || 0), 0);
    });
    return counts;
  }, [prefectureCounts]);

  const maxRegionCount = Math.max(...Object.values(regionCounts), 1);
  const totalCount = Object.values(prefectureCounts).reduce((sum, count) => sum + count, 0);

  // 最も参加者が多い地域を特定
  const hotRegion = useMemo(() => {
    let maxCount = 0;
    let hotRegionName = "";
    Object.entries(regionCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        hotRegionName = name;
      }
    });
    return { name: hotRegionName, count: maxCount };
  }, [regionCounts]);

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
          🗾 地域別参加者マップ
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 12, marginLeft: 8 }}>
          合計 {totalCount}人
        </Text>
      </View>

      {/* 地域カード */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
        {regionGroups.map((region) => {
          const count = regionCounts[region.name] || 0;
          const intensity = count / maxRegionCount;
          const isHot = region.name === hotRegion.name && count > 0;
          
          return (
            <Pressable
              key={region.name}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onPrefecturePress) {
                  onPrefecturePress(region.name);
                }
              }}
              style={({ pressed }) => [{
                width: "48%",
                backgroundColor: isHot ? palette.pink500 + "33" : color.surface, // 20% opacity
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: isHot ? 2 : 1,
                borderColor: isHot ? color.accentPrimary : count > 0 ? palette.pink500 + opacityToHex(0.3 + intensity * 0.5) : color.border,
              }, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: region.color,
                    marginRight: 8,
                  }} />
                  <Text style={{ color: color.textMuted, fontSize: 12 }}>{region.name}</Text>
                </View>
                {isHot && (
                  <Text style={{ fontSize: 12 }}>🔥</Text>
                )}
              </View>
              <Text style={{ 
                color: count > 0 ? color.accentPrimary : color.textSubtle, 
                fontSize: 24, 
                fontWeight: "bold",
                marginTop: 4,
              }}>
                {count}<Text style={{ fontSize: 14, color: color.textMuted }}>人</Text>
              </Text>
              
              {/* 参加者バー */}
              <View style={{
                height: 4,
                backgroundColor: color.border,
                borderRadius: 2,
                marginTop: 8,
                overflow: "hidden",
              }}>
                <View style={{
                  height: "100%",
                  width: `${intensity * 100}%`,
                  backgroundColor: region.color,
                  borderRadius: 2,
                }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ホットな地域のハイライト */}
      {hotRegion.count > 0 && (
        <View style={{
          backgroundColor: palette.pink500 + "26", // 15% opacity
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: palette.pink500 + "4D", // 30% opacity
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: color.accentPrimary, fontSize: 14, fontWeight: "bold" }}>
              {hotRegion.name}が熱い！
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
              {hotRegion.count}人が参加表明中
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * JapanMap - エラーバウンダリでラップされたメインコンポーネント
 */
export function JapanMap(props: JapanMapProps) {
  return (
    <MapErrorBoundary mapType="standard" height={350}>
      <JapanMapInner {...props} />
    </MapErrorBoundary>
  );
}

// シンプルな地域別表示（グリッドの代わり）
export function SimpleRegionMap({ prefectureCounts }: { prefectureCounts: PrefectureCount }) {
  // 地域ごとの参加者数を集計
  const regionCounts = useMemo(() => {
    const counts: { [region: string]: number } = {};
    regionGroups.forEach(region => {
      counts[region.name] = region.prefectures.reduce((sum, pref) => sum + (prefectureCounts[pref] || 0), 0);
    });
    return counts;
  }, [prefectureCounts]);

  const maxRegionCount = Math.max(...Object.values(regionCounts), 1);
  const totalCount = Object.values(prefectureCounts).reduce((sum, count) => sum + count, 0);

  // 最も参加者が多い地域を特定
  const hotRegion = useMemo(() => {
    let maxCount = 0;
    let hotRegionName = "";
    Object.entries(regionCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        hotRegionName = name;
      }
    });
    return { name: hotRegionName, count: maxCount };
  }, [regionCounts]);

  if (totalCount === 0) {
    return (
      <View style={{ marginVertical: 16, alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 48 }}>🗾</Text>
        <Text style={{ color: color.textMuted, fontSize: 14, marginTop: 8, textAlign: "center" }}>
          まだ参加者がいません{"\n"}最初の参加者になろう！
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
          🗾 地域別参加者
        </Text>
        <Text style={{ color: color.textMuted, fontSize: 12, marginLeft: 8 }}>
          合計 {totalCount}人
        </Text>
      </View>

      {/* 地域カード */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {regionGroups.map((region) => {
          const count = regionCounts[region.name] || 0;
          const intensity = count / maxRegionCount;
          const isHot = region.name === hotRegion.name && count > 0;
          
          return (
            <View
              key={region.name}
              style={{
                width: "48%",
                backgroundColor: isHot ? palette.pink500 + "33" : color.surface, // 20% opacity
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                borderWidth: isHot ? 2 : 1,
                borderColor: isHot ? color.accentPrimary : count > 0 ? palette.pink500 + opacityToHex(0.3 + intensity * 0.5) : color.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: region.color,
                    marginRight: 6,
                  }} />
                  <Text style={{ color: color.textMuted, fontSize: 12 }}>{region.name}</Text>
                </View>
                {isHot && (
                  <Text style={{ fontSize: 10 }}>🔥</Text>
                )}
              </View>
              <Text style={{ 
                color: count > 0 ? color.accentPrimary : color.textSubtle, 
                fontSize: 20, 
                fontWeight: "bold",
                marginTop: 4,
              }}>
                {count}<Text style={{ fontSize: 12, color: color.textMuted }}>人</Text>
              </Text>
              
              {/* 参加者バー */}
              <View style={{
                height: 3,
                backgroundColor: color.border,
                borderRadius: 2,
                marginTop: 6,
                overflow: "hidden",
              }}>
                <View style={{
                  height: "100%",
                  width: `${intensity * 100}%`,
                  backgroundColor: region.color,
                  borderRadius: 2,
                }} />
              </View>
            </View>
          );
        })}
      </View>

      {/* ホットな地域のハイライト */}
      {hotRegion.count > 0 && (
        <View style={{
          backgroundColor: palette.pink500 + "26", // 15% opacity
          borderRadius: 12,
          padding: 14,
          marginTop: 8,
          borderWidth: 1,
          borderColor: palette.pink500 + "4D", // 30% opacity
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 20, marginRight: 10 }}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: color.accentPrimary, fontSize: 13, fontWeight: "bold" }}>
              {hotRegion.name}が熱い！
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12, marginTop: 2 }}>
              {hotRegion.count}人が参加表明中
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
