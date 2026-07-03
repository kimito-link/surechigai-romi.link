/**
 * ヘッダーの「居場所ON」バッジ。tRPC `settings.get` を取得する必要があるため、
 * hook 呼び出しを AppHeader 本体から隔離している。
 *
 * ゲスト `/` は tRPC Provider を window load + idle まで mount しない
 * （guest-web-providers.tsx の defer 境界）。この窓の間 useQuery を呼ぶと
 * Context 不在で throw する（`enabled: false` では防げない）ため、
 * useTrpcReady() が false の間はこのコンポーネント自体を描画しない。
 */
import { View, Text, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { palette } from "@/theme/tokens";
import { useTrpcReady } from "@/lib/trpc-ready-context";

type LivePresenceBadgeProps = {
  /** ログイン状態が確定し、ユーザーが存在するときだけ true */
  enabled: boolean;
};

export function LivePresenceBadge({ enabled }: LivePresenceBadgeProps) {
  const trpcReady = useTrpcReady();
  if (!trpcReady) return null;
  return <LivePresenceBadgeInner enabled={enabled} />;
}

function LivePresenceBadgeInner({ enabled }: LivePresenceBadgeProps) {
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled,
    staleTime: 30_000,
  });

  if (!settings?.livePresenceEnabled) return null;

  return (
    <View style={styles.liveBadge} accessibilityLabel="居場所をリアルタイム公開中">
      <View style={styles.liveDot} />
      <Text style={styles.liveBadgeText}>居場所ON</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,128,51,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,128,51,0.35)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.kimitoOrange,
  },
  liveBadgeText: {
    color: palette.kimitoOrange,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
