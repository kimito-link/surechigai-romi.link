/**
 * 未ログインのゲスト画面に出す「いまの様子」（天気・ライブカメラ）。
 *
 * ★2026-08-17 に追加した理由:
 * 天気とライブカメラはログイン後の画面にしか無く、**未ログインでは存在ごと見えなかった**
 * （実測: ゲストの /map は OneTapGuestShell を描くだけで PlaceContextBar を含まない）。
 * ユーザーから「天気の機能もライブカメラの機能もどこにあるか分からない」と繰り返し
 * 指摘されており、「データが無い／ログインしていないと機能が消える」のは
 * 使う側から見れば機能が無いのと同じ。
 *
 * 見せる場所は「いま一番人がいる県」。位置情報は新しく取らない
 * （zukan.activePrefectures は「みんなの現在地」で既に使っている公開クエリ）。
 */
import { View, StyleSheet } from "react-native";
import { PlaceContextBar } from "@/components/molecules/place-context-bar";
import { trpc } from "@/lib/trpc";
import { useTrpcReady } from "@/lib/trpc-ready-context";
import { contentMaxWidth } from "@/theme/tokens";

export function GuestPlaceContext() {
  /* tRPC Provider の解決前に useQuery を呼ぶと "Unable to find tRPC Context" で
     画面ごと落ちる（enabled:false では防げない。2026-07 の実障害）。
     ゲストWebシェルは `/` で tRPC を defer するので、必ずゲートを通す。 */
  const trpcReady = useTrpcReady();
  if (!trpcReady) return null;

  return <GuestPlaceContextInner />;
}

function GuestPlaceContextInner() {
  /* 公開クエリなので未ログインでも叩ける。失敗したら何も出さないだけ（画面は壊さない）。 */
  const { data } = trpc.zukan.activePrefectures.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const prefecture = data?.prefectures?.[0]?.prefecture ?? null;
  if (!prefecture) return null;

  return (
    <View style={styles.wrap}>
      <PlaceContextBar prefecture={null} fallbackPrefecture={prefecture} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    marginTop: 12,
  },
});

export default GuestPlaceContext;
