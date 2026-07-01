import { View, StyleSheet } from "react-native";

const SKELETON = "#E2E8F0";

/** メイン領域のみ — タブ shell（サイドナビ/フッター）は隠さない。 */
export function ChunkFallback({ minHeight = 220 }: { minHeight?: number }) {
  return (
    <View style={[styles.wrap, { minHeight }]}>
      <View style={[styles.line, styles.title, { backgroundColor: SKELETON }]} />
      <View style={[styles.line, styles.sub, { backgroundColor: SKELETON }]} />
      <View style={[styles.line, styles.subShort, { backgroundColor: SKELETON }]} />
      <View style={[styles.card, { backgroundColor: SKELETON }]} />
    </View>
  );
}

/** @deprecated MapChunkFallback の別名 */
export const MapChunkFallback = ChunkFallback;

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    padding: 16,
    gap: 12,
    backgroundColor: "#F0F4F8",
  },
  line: {
    borderRadius: 6,
  },
  title: {
    height: 28,
    width: "55%",
  },
  sub: {
    height: 14,
    width: "92%",
  },
  subShort: {
    height: 14,
    width: "72%",
  },
  card: {
    height: 120,
    width: "100%",
    borderRadius: 12,
    marginTop: 4,
  },
});
