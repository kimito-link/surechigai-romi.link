/**
 * ポスト画面 — 認証ゲート + 本体 chunk の遅延読み込み。
 * 未ログイン時は radar / tRPC / reanimated chunk を読まない。
 */
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PostGuestScreen } from "@/components/post/post-guest-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { color } from "@/theme/tokens";

const PostAuthenticatedScreen = lazy(() =>
  import("@/components/post/post-authenticated-screen").then((m) => ({
    default: m.PostAuthenticatedScreen,
  })),
);

export default function PostScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={color.accentPrimary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <PostGuestScreen />;
  }

  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <PostAuthenticatedScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.bg,
  },
});
