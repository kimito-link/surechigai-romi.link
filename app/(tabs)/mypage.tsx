/**
 * マイページ — 認証ゲート。未ログイン時は tRPC / 設定 chunk を読まない。
 */
import { lazy, Suspense } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuth } from "@/hooks/use-auth";
import { TabGuestPreviewScreen } from "@/components/tabs/tab-guest-preview-screen";
import { ChunkFallback } from "@/lib/chunk-fallback";
import { color } from "@/theme/tokens";

const MypageAuthenticatedScreen = lazy(() =>
  import("@/components/mypage/mypage-authenticated-screen").then((m) => ({
    default: m.MypageAuthenticatedScreen,
  })),
);

function MypageGuestPlaceholder() {
  return (
    <View style={guestStyles.profileCard}>
      <View style={guestStyles.avatarPlaceholder}>
        <MaterialIcons name="account-circle" size={64} color={color.textMuted} />
      </View>
      <View style={guestStyles.profileInfo}>
        <Text style={guestStyles.profileName}>ログイン後に表示されます</Text>
        <Text style={guestStyles.profileUsername}>@yourname</Text>
      </View>
    </View>
  );
}

export default function MypageScreen() {
  const { isAuthenticated, isAuthReadyForUI } = useAuth();

  if (!isAuthReadyForUI) {
    return <ChunkFallback minHeight={360} />;
  }

  if (!isAuthenticated) {
    return (
      <TabGuestPreviewScreen
        title="マイページ"
        headline="ログインすると、あなた専用のマイページが使えます"
        benefits={[
          { icon: "edit", label: "ひとこと・プロフィールを設定できる" },
          { icon: "ios-share", label: "現在地をXでシェアできる" },
          { icon: "security", label: "位置情報の一時停止やブロック設定ができる" },
        ]}
      >
        <MypageGuestPlaceholder />
      </TabGuestPreviewScreen>
    );
  }

  return (
    <Suspense fallback={<ChunkFallback minHeight={360} />}>
      <MypageAuthenticatedScreen />
    </Suspense>
  );
}

const guestStyles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: color.textPrimary,
  },
  profileUsername: {
    fontSize: 13,
    color: color.textMuted,
  },
});
