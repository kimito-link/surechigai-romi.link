import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { color, palette } from "@/theme/tokens";
import {
  prefectureShortLabel,
  prefectureBaseLabel,
} from "@/modules/encounter/core/prefecture-labels";
import { computeMapLayout } from "@/components/organisms/japan-block-map-layout";

type JapanBlockMapProps = {
  visitedPrefSet: Set<string>;
  encounteredPrefSet: Set<string>;
  /** 公開ユーザーの直近24h / リアルタイム居場所（みんなの現在地） */
  activePrefSet?: Set<string>;
  encounterCountMap?: Record<string, number>;
  onPressPrefecture: (prefecture: string) => void;
  /** 呼び出し側で実測したコンテナ幅（未指定時はウィンドウ幅を使う） */
  availableWidth?: number;
  /** 地図の最大幅（デフォルト760px。ゲストヒーロー等で広げたい場合に指定） */
  maxMapWidth?: number;
};

// レイアウト計算は japan-block-map-layout.ts に一元化（見切れ事故の再発をテストで検知するため）。

// 12 rows, 14 cols grid
// null is empty space
const JAPAN_GRID: (string | null)[][] = [
  [null, null, null, null, null, null, null, null, null, null, null, null, null, "北海道"],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, "青森県"],
  [null, null, null, null, null, null, null, null, null, null, null, null, "秋田県", "岩手県"],
  [null, null, null, null, null, null, null, null, null, null, null, null, "山形県", "宮城県"],
  [null, null, null, null, null, null, null, null, null, "新潟県", "福島県", null, null, null],
  [null, null, null, null, null, null, null, "石川県", "富山県", "群馬県", "栃木県", "茨城県", null, null],
  [null, null, null, null, null, null, null, "福井県", "長野県", "埼玉県", "東京都", "千葉県", null, null],
  [null, null, "山口県", "島根県", "鳥取県", "兵庫県", "京都府", "滋賀県", "岐阜県", "山梨県", "神奈川県", null, null, null],
  [null, null, null, "広島県", "岡山県", "大阪府", "奈良県", "三重県", "愛知県", "静岡県", null, null, null, null],
  ["長崎県", "佐賀県", "福岡県", null, "愛媛県", "香川県", "和歌山県", null, null, null, null, null, null, null],
  [null, "熊本県", "大分県", null, "高知県", "徳島県", null, null, null, null, null, null, null, null],
  [null, "鹿児島県", "宮崎県", null, null, null, null, null, null, null, null, null, null, null],
  ["沖縄県", null, null, null, null, null, null, null, null, null, null, null, null, null],
];

export function JapanBlockMap({
  visitedPrefSet,
  encounteredPrefSet,
  activePrefSet,
  encounterCountMap,
  onPressPrefecture,
  availableWidth,
  maxMapWidth = 760,
}: JapanBlockMapProps) {
  const { width } = useWindowDimensions();
  // 実際に置かれたコンテナ幅を測る。ウィンドウ幅だけを見ると、
  // 親に余白やサイドナビがある画面で幅を過大評価して見切れる。
  //
  // ★測るのは中身を持たない専用の View（高さ0の物差し）。
  //   地図本体を包む View で測ると「測った幅で地図を作る→その地図の幅がまた測られる」の
  //   自己参照になり、画面を狭めても縮まなくなる（2026-08-01 実測で確認）。
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    // 0 は初回レイアウト前などに来る。採用すると最小幅に張り付くので無視する
    if (w > 0) setMeasuredWidth((prev) => (prev === w ? prev : w));
  }, []);

  // 優先順位: 明示指定 > 実測 > ウィンドウ幅。
  // 実測値は既に親の余白が引かれているので、二重に引かないよう alreadyInset を立てる。
  const explicit = availableWidth ?? measuredWidth;
  // レイアウト計算は computeMapLayout に一元化（テストで見切れ再発を検知するため）。
  const { cellSize, fontSize, gap, maxChars } = computeMapLayout(
    explicit ?? width,
    maxMapWidth,
    explicit != null,
  );
  const radius = Math.max(4, Math.round(cellSize * 0.16));

  /**
   * セルに表示する県名。
   * 収まる文字数（maxChars）に合わせて切り詰める。
   * ★ellipsis に任せない: 「北海」が「北…」になって読めなくなるため
   *   （2026-08-01、3xスケールのスクショで発覚）。文字数はこちらで決める。
   */
  const cellLabel = (pref: string) => {
    if (maxChars >= 3) return prefectureBaseLabel(pref);
    const short = prefectureShortLabel(pref);
    return maxChars === 2 ? short : short.slice(0, 1);
  };

  const grid = (
    <View style={styles.container}>
      {/* 幅を測るためだけの物差し（高さ0・中身なし）。地図の幅に影響されない */}
      <View style={styles.widthProbe} onLayout={onLayout} pointerEvents="none" />
      {JAPAN_GRID.map((row, rIdx) => (
        <View key={rIdx} style={[styles.row, { gap }]}>
          {row.map((pref, cIdx) => {
            if (!pref) {
              return (
                <View
                  key={`${rIdx}-${cIdx}`}
                  style={[styles.emptyCell, { width: cellSize, height: cellSize }]}
                />
              );
            }

            const isActiveNow = activePrefSet?.has(pref) ?? false;
            const isVisited = visitedPrefSet.has(pref);
            const isEncountered = encounteredPrefSet.has(pref);
            const encounterCount = encounterCountMap?.[pref] || 0;

            const bg = isActiveNow
              ? palette.kimitoBlue + "55"
              : isVisited
              ? color.accentIndigo + "44"
              : isEncountered
                ? color.accentAlt + "44"
                : color.surfaceAlt;
            const borderColor = isActiveNow
              ? palette.kimitoBlue
              : isVisited
              ? color.accentIndigo
              : isEncountered
                ? color.accentAlt
                : color.border;
            const textColor =
              isActiveNow || isVisited || isEncountered ? color.textPrimary : color.textMuted;

            return (
              <Pressable
                key={pref}
                onPress={() => onPressPrefecture(pref)}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: radius,
                    backgroundColor: bg,
                    borderColor: borderColor,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.cellText, { color: textColor, fontSize }]}
                  numberOfLines={1}
                >
                  {cellLabel(pref)}
                </Text>
                {encounterCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{encounterCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );

  // 常に収まるサイズで描画するため、横スクロール経路は持たない。
  return grid;
}

const styles = StyleSheet.create({
  container: {
    // 親の幅いっぱいに広がってから中身を中央寄せする。
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    // 上下の余白は控えめに。狭い画面ではファーストビューを圧迫するため。
    marginVertical: 12,
  },
  /** 幅を測る専用の物差し。高さ0で見た目に影響しない */
  widthProbe: {
    width: "100%",
    height: 0,
  },
  row: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 2,
  },
  emptyCell: {
    backgroundColor: "transparent",
  },
  cell: {
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 1,
  },
  cellText: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: color.accentAlt,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "bold",
  },
});
