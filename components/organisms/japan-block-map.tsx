import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { color, palette } from "@/theme/tokens";
import {
  prefectureShortLabel,
  prefectureBaseLabel,
} from "@/modules/encounter/core/prefecture-labels";

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

/** このサイズ以上ならフルネーム(prefectureBaseLabel、最大3文字)を表示。未満は2文字表記のまま。 */
const FULL_NAME_MIN_CELL_SIZE = 42;

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
  // 画面幅いっぱい（最大760px、maxMapWidthで上書き可）まで使い、14列で割ってセルサイズを決める。
  //   どの画面でも大きく読みやすくするため、上限を画面幅に追従させる（旧: 40px固定上限で小さすぎた）。
  const cols = 14;
  const gap = 3;
  const outerPadding = 24;
  const baseW = availableWidth ?? width;
  const safeWidth = Math.max(baseW || 320, 320);
  const avail = Math.min(safeWidth - outerPadding, maxMapWidth);
  const cellSize = Math.max(20, Math.floor((avail - gap * (cols - 1)) / cols));
  // フルネーム(最大3文字)が12px以上で収まるセルサイズになったら短縮をやめる。
  const showFullName = cellSize >= FULL_NAME_MIN_CELL_SIZE;
  // フォントはセルに比例（小画面でも下限8px、大画面では大きく）。フルネーム時は3文字が
  // はみ出さないよう (cellSize-6)/3 でも上限を掛ける。
  const fontSize = showFullName
    ? Math.min(Math.round(cellSize * 0.34), Math.floor((cellSize - 6) / 3))
    : Math.max(8, Math.round(cellSize * 0.34));
  const radius = Math.max(4, Math.round(cellSize * 0.16));

  return (
    <View style={styles.container}>
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
                  {showFullName ? prefectureBaseLabel(pref) : prefectureShortLabel(pref)}
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
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
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
