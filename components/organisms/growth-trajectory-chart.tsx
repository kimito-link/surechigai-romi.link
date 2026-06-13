import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { color } from "@/theme/tokens";
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { useMemo } from "react";

interface DataPoint {
  date: Date;
  count: number;
  milestone?: string;
}

interface GrowthTrajectoryChartProps {
  data: DataPoint[];
  targetCount: number;
  title?: string;
}

// 日付をフォーマット
function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 数値を短縮形式でフォーマット
function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}千`;
  }
  return num.toString();
}

// レスポンシブブレークポイント（8段階）
function getResponsiveConfig(width: number) {
  if (width < 320) {
    // 超小型（280px〜319px）
    return { 
      chartWidth: width - 24, 
      chartHeight: 200, 
      paddingLeft: 40, 
      paddingRight: 12, 
      paddingTop: 32, 
      paddingBottom: 40,
      fontSize: 12,
      titleSize: 14,
      subtitleSize: 11,
      legendSize: 10,
      padding: 12,
    };
  } else if (width < 375) {
    // 小型（320px〜374px）
    return { 
      chartWidth: width - 28, 
      chartHeight: 220, 
      paddingLeft: 45, 
      paddingRight: 16, 
      paddingTop: 36, 
      paddingBottom: 45,
      fontSize: 12,
      titleSize: 16,
      subtitleSize: 12,
      legendSize: 11,
      padding: 14,
    };
  } else if (width < 414) {
    // 標準（375px〜413px）
    return { 
      chartWidth: width - 32, 
      chartHeight: 260, 
      paddingLeft: 50, 
      paddingRight: 20, 
      paddingTop: 40, 
      paddingBottom: 50,
      fontSize: 12,
      titleSize: 18,
      subtitleSize: 14,
      legendSize: 12,
      padding: 16,
    };
  } else if (width < 768) {
    // 大型スマホ（414px〜767px）
    return { 
      chartWidth: Math.min(width - 32, 420), 
      chartHeight: 280, 
      paddingLeft: 55, 
      paddingRight: 24, 
      paddingTop: 44, 
      paddingBottom: 54,
      fontSize: 12,
      titleSize: 20,
      subtitleSize: 15,
      legendSize: 13,
      padding: 18,
    };
  } else if (width < 1024) {
    // タブレット（768px〜1023px）
    return { 
      chartWidth: Math.min(width - 48, 600), 
      chartHeight: 320, 
      paddingLeft: 60, 
      paddingRight: 28, 
      paddingTop: 48, 
      paddingBottom: 58,
      fontSize: 12,
      titleSize: 22,
      subtitleSize: 16,
      legendSize: 14,
      padding: 20,
    };
  } else if (width < 1440) {
    // 小型PC（1024px〜1439px）
    return { 
      chartWidth: Math.min(width - 64, 720), 
      chartHeight: 360, 
      paddingLeft: 65, 
      paddingRight: 32, 
      paddingTop: 52, 
      paddingBottom: 62,
      fontSize: 13,
      titleSize: 24,
      subtitleSize: 17,
      legendSize: 15,
      padding: 24,
    };
  } else if (width < 2560) {
    // 大型PC（1440px〜2559px）
    return { 
      chartWidth: Math.min(width - 80, 840), 
      chartHeight: 400, 
      paddingLeft: 70, 
      paddingRight: 36, 
      paddingTop: 56, 
      paddingBottom: 66,
      fontSize: 14,
      titleSize: 26,
      subtitleSize: 18,
      legendSize: 16,
      padding: 28,
    };
  } else {
    // 4K（2560px以上）
    return { 
      chartWidth: Math.min(width - 96, 960), 
      chartHeight: 440, 
      paddingLeft: 80, 
      paddingRight: 40, 
      paddingTop: 60, 
      paddingBottom: 70,
      fontSize: 16,
      titleSize: 28,
      subtitleSize: 20,
      legendSize: 18,
      padding: 32,
    };
  }
}

export function GrowthTrajectoryChart({ data, targetCount, title = "動員までの軌跡" }: GrowthTrajectoryChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const config = getResponsiveConfig(screenWidth);
  
  const { chartWidth, chartHeight, paddingLeft, paddingRight, paddingTop, paddingBottom } = config;
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const { pathData, milestones, yAxisLabels, xAxisLabels, currentCount, progressPercent } = useMemo(() => {
    if (data.length === 0) {
      return {
        pathData: "",
        milestones: [],
        yAxisLabels: [],
        xAxisLabels: [],
        currentCount: 0,
        progressPercent: 0,
      };
    }

    // Y軸の最大値を計算（目標値または最大データ値の大きい方）
    const maxDataCount = Math.max(...data.map(d => d.count));
    const yMax = Math.max(targetCount, maxDataCount) * 1.1;
    
    // X軸の範囲を計算
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const dateRange = endDate.getTime() - startDate.getTime();
    
    // パスデータを生成
    const points = data.map((d, i) => {
      const x = paddingLeft + (dateRange > 0 
        ? ((d.date.getTime() - startDate.getTime()) / dateRange) * graphWidth 
        : graphWidth / 2);
      const y = paddingTop + graphHeight - (d.count / yMax) * graphHeight;
      return { x, y, ...d };
    });
    
    // スムーズな曲線を生成
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3;
      pathD += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    // マイルストーンを抽出
    const milestonesData = points.filter(p => p.milestone);
    
    // Y軸ラベルを生成
    const yLabels = [];
    const yStep = yMax / 5;
    for (let i = 0; i <= 5; i++) {
      const value = Math.round(yStep * i);
      const y = paddingTop + graphHeight - (value / yMax) * graphHeight;
      yLabels.push({ value, y });
    }
    
    // X軸ラベルを生成（最大5つ）
    const xLabels = [];
    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const index = Math.floor((data.length - 1) * i / (labelCount - 1 || 1));
      const d = data[index];
      const x = paddingLeft + (dateRange > 0 
        ? ((d.date.getTime() - startDate.getTime()) / dateRange) * graphWidth 
        : graphWidth / 2);
      xLabels.push({ date: d.date, x });
    }
    
    const current = data[data.length - 1].count;
    const progress = (current / targetCount) * 100;
    
    return {
      pathData: pathD,
      milestones: milestonesData,
      yAxisLabels: yLabels,
      xAxisLabels: xLabels,
      currentCount: current,
      progressPercent: Math.min(progress, 100),
    };
  }, [data, targetCount, graphWidth, graphHeight, paddingLeft, paddingTop]);

  // 目標ラインのY座標
  const targetY = useMemo(() => {
    if (data.length === 0) return paddingTop;
    const maxDataCount = Math.max(...data.map(d => d.count));
    const yMax = Math.max(targetCount, maxDataCount) * 1.1;
    return paddingTop + graphHeight - (targetCount / yMax) * graphHeight;
  }, [data, targetCount, graphHeight, paddingTop]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { padding: config.padding }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: config.titleSize }]}>📈 {title}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyText, { fontSize: config.subtitleSize }]}>
            まだデータがありません{"\n"}参加者が増えると軌跡が表示されます
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: config.titleSize }]}>📈 {title}</Text>
        <Text style={[styles.subtitle, { fontSize: config.subtitleSize }]}>
          現在 {formatNumber(currentCount)}人 / 目標 {formatNumber(targetCount)}人 ({progressPercent.toFixed(1)}%)
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color.coral} stopOpacity="1" />
              <Stop offset="1" stopColor={color.orange400} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color.coral} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color.coral} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* グリッド線 */}
          {yAxisLabels.map((label, i) => (
            <Line
              key={`grid-${i}`}
              x1={paddingLeft}
              y1={label.y}
              x2={chartWidth - paddingRight}
              y2={label.y}
              stroke={color.textPrimary}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}

          {/* 目標ライン */}
          <Line
            x1={paddingLeft}
            y1={targetY}
            x2={chartWidth - paddingRight}
            y2={targetY}
            stroke={color.successDark}
            strokeWidth={2}
            strokeDasharray="8,4"
          />
          <SvgText
            x={chartWidth - paddingRight - 5}
            y={targetY - 8}
            fill={color.successDark}
            fontSize={config.fontSize}
            fontWeight="bold"
            textAnchor="end"
          >
            目標 {formatNumber(targetCount)}人
          </SvgText>

          {/* 成長曲線（塗りつぶしエリア） */}
          {pathData && (
            <Path
              d={`${pathData} L ${paddingLeft + graphWidth} ${paddingTop + graphHeight} L ${paddingLeft} ${paddingTop + graphHeight} Z`}
              fill="url(#areaGradient)"
            />
          )}

          {/* 成長曲線（ライン） */}
          {pathData && (
            <Path
              d={pathData}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* マイルストーンマーカー */}
          {milestones.map((m, i) => (
            <G key={`milestone-${i}`}>
              <Circle
                cx={m.x}
                cy={m.y}
                r={8}
                fill={color.textWhite}
                stroke={color.coral}
                strokeWidth={2}
              />
              <Circle
                cx={m.x}
                cy={m.y}
                r={4}
                fill={color.coral}
              />
              {/* マイルストーンラベル */}
              <SvgText
                x={m.x}
                y={m.y - 15}
                fill={color.mapText}
                fontSize={config.fontSize - 1}
                fontWeight="bold"
                textAnchor="middle"
              >
                {m.milestone}
              </SvgText>
            </G>
          ))}

          {/* 現在地点のマーカー */}
          {data.length > 0 && (
            <G>
              <Circle
                cx={paddingLeft + graphWidth}
                cy={paddingTop + graphHeight - (currentCount / (Math.max(targetCount, currentCount) * 1.1)) * graphHeight}
                r={10}
                fill={color.textWhite}
                stroke={color.coral}
                strokeWidth={3}
              />
              <SvgText
                x={paddingLeft + graphWidth}
                y={paddingTop + graphHeight - (currentCount / (Math.max(targetCount, currentCount) * 1.1)) * graphHeight + 4}
                fill={color.coral}
                fontSize={config.fontSize - 2}
                fontWeight="bold"
                textAnchor="middle"
              >
                今
              </SvgText>
            </G>
          )}

          {/* Y軸ラベル */}
          {yAxisLabels.map((label, i) => (
            <SvgText
              key={`y-label-${i}`}
              x={paddingLeft - 8}
              y={label.y + 4}
              fill={color.textSubtle}
              fontSize={config.fontSize}
              textAnchor="end"
            >
              {formatNumber(label.value)}
            </SvgText>
          ))}

          {/* X軸ラベル */}
          {xAxisLabels.map((label, i) => (
            <SvgText
              key={`x-label-${i}`}
              x={label.x}
              y={chartHeight - paddingBottom + 20}
              fill={color.textSubtle}
              fontSize={config.fontSize}
              textAnchor="middle"
            >
              {formatDate(label.date)}
            </SvgText>
          ))}

          {/* 軸線 */}
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + graphHeight}
            stroke={color.textPrimary}
            strokeWidth={1}
          />
          <Line
            x1={paddingLeft}
            y1={paddingTop + graphHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + graphHeight}
            stroke={color.textPrimary}
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* 凡例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: color.coral }]} />
          <Text style={[styles.legendText, { fontSize: config.legendSize }]}>参加者数の推移</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: color.successDark, borderStyle: "dashed" }]} />
          <Text style={[styles.legendText, { fontSize: config.legendSize }]}>目標ライン</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    marginVertical: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    color: color.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: color.textSecondary,
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: color.textWhite,
    borderRadius: 12,
    padding: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    color: color.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: color.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
