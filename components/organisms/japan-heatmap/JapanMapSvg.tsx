/**
 * JapanMapSvg - 日本地図SVG
 * 
 * 単一責任: 47都道府県の地図描画のみ
 */

import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import Svg, { Path, G, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { color, palette } from "@/theme/tokens";
import { prefecturesData } from "@/lib/prefecture-paths";
import { MAP_CONFIG, PREFECTURE_LABEL_POSITIONS } from "./constants";
import { getHeatColor, normalizePrefectureName, getShortPrefectureName, getDynamicIcon } from "./utils";

/** 地図の最大幅（大画面でも見やすい上限） */
const MAP_MAX_WIDTH = 480;
/** 地図の最小幅（小さい画面でも都道府県が押しやすい） */
const MAP_MIN_WIDTH = 280;
/** 左右パディング合計 */
const HORIZONTAL_PADDING = 32;

interface JapanMapSvgProps {
  prefectureCounts47: Record<number, number>;
  maxPrefectureCount: number;
  onPrefecturePress?: (prefectureName: string) => void;
}

export function JapanMapSvg({
  prefectureCounts47,
  maxPrefectureCount,
  onPrefecturePress,
}: JapanMapSvgProps) {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = Math.max(
    MAP_MIN_WIDTH,
    Math.min(screenWidth - HORIZONTAL_PADDING, MAP_MAX_WIDTH)
  );
  const mapHeight = mapWidth * MAP_CONFIG.aspectRatio;
  const { viewBoxWidth, viewBoxHeight, scale, offsetX, offsetY } = MAP_CONFIG;

  return (
    <View style={[styles.mapContainer, { width: mapWidth, height: mapHeight }]}>
      <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
        {/* 海の背景 */}
        <G>
          <Path d={`M0,0 H${viewBoxWidth} V${viewBoxHeight} H0 Z`} fill={color.mapWater} />
        </G>
        
        <G transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
          {/* 都道府県のパス */}
          {prefecturesData.map((pref) => {
            const count = prefectureCounts47[pref.code] || 0;
            const heatColor = getHeatColor(count, maxPrefectureCount);
            const prefName = normalizePrefectureName(pref.name);
            
            const handlePress = () => {
              if (onPrefecturePress) {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onPrefecturePress(prefName);
              }
            };
            
            return (
              <G 
                key={pref.code} 
                transform={`translate(${pref.tx}, ${pref.ty})`}
              >
                {pref.paths.map((pathData, idx) => (
                  <Path
                    key={`${pref.code}-${idx}`}
                    d={pathData}
                    fill={heatColor}
                    stroke={color.mapStroke}
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                    onPress={handlePress}
                  />
                ))}
              </G>
            );
          })}
          
          {/* 都道府県名と人数のラベル + アイコン */}
          {prefecturesData.map((pref) => {
            const count = prefectureCounts47[pref.code] || 0;
            const labelPos = PREFECTURE_LABEL_POSITIONS[pref.code];
            if (!labelPos) return null;
            
            const shortName = getShortPrefectureName(pref.name);
            
            return (
              <G key={`label-${pref.code}`}>
                {/* 動的アイコン */}
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y - 20}
                  fontSize={16}
                  textAnchor="middle"
                >
                  {getDynamicIcon(count)}
                </SvgText>
                {/* 都道府県名 */}
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y}
                  fill={color.mapText}
                  fontSize={count > 0 ? 11 : 9}
                  fontWeight={count > 0 ? "bold" : "normal"}
                  textAnchor="middle"
                >
                  {shortName}
                </SvgText>
                {/* 人数 */}
                {count > 0 && (
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y + 12}
                    fill={color.mapText}
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {count.toLocaleString()}名
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: palette.gray600,
  },
});
