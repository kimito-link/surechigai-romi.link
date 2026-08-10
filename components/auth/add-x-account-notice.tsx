/**
 * 別のXアカウントを「追加」するときの注意書きカード（/sign-in の追加モードで表示）。
 *
 * なぜ要るか（世界の定石）: X の OAuth 2.0 は force_login / prompt=select_account を持たない。
 * ブラウザに今のXアカウントのセッションが残っていると、認可画面が素通りして**同じ垢に戻る**。
 * アプリ側から別垢認証を強制する手段は無いので、Buffer 等と同じく「先にX側を切り替えてね」と
 * ユーザーに案内するしかない（設計 docs/MULTI-SESSION-X-SWITCH-DESIGN.md A/C）。
 *
 * ログイン済みで /sign-in が開かれた＝「アカウントを追加」導線＝このカードを出す。
 * x.com/logout は switch-x-account-modal と同じ流儀（タップハンドラ内で同期 open・
 * noopener,noreferrer・redirect_after_logout は付けない）で X_LOGOUT_URL を共有する。
 */
import { useState } from "react";
import { Platform, Pressable, Text, View, Linking, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { borderRadius, color, palette, spacing } from "@/theme/tokens";
import { useAuth } from "@/hooks/use-auth";
import { X_LOGOUT_URL } from "@/components/auth/switch-x-account-modal";

export function AddXAccountNotice() {
  const { user } = useAuth();
  const [opened, setOpened] = useState(false);
  const handle = user?.username ? `@${user.username}` : "いまのアカウント";

  const handleOpenXLogout = () => {
    void Haptics.selectionAsync().catch(() => {});
    // ★タップハンドラ内で同期的に開く（await を挟むとポップアップブロック・既踏の地雷）。
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(X_LOGOUT_URL, "_blank", "noopener,noreferrer");
    } else {
      void Linking.openURL(X_LOGOUT_URL).catch(() => {});
    }
    setOpened(true);
  };

  return (
    <View style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>別のXアカウントを追加しますか？</Text>
      <Text style={styles.body}>
        Xの画面が今のアカウント（{handle}）を覚えたままだと、認可が素通りして同じアカウントに戻ります。
        追加したいアカウントに切り替えるため、先にXを一度ログアウトしてください。
      </Text>
      <Pressable
        onPress={handleOpenXLogout}
        accessibilityRole="button"
        accessibilityLabel="Xのログアウト画面を別タブで開く"
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.buttonText}>Xのログアウト画面を開く（別タブ）</Text>
      </Pressable>
      <Text style={styles.hint}>
        {opened
          ? "ログアウト（またはX側でアカウント切替）できたら、この画面に戻って下の「Xでログイン」を押してください。"
          : "別タブでXからログアウトできたら、この画面に戻って下の「Xでログイン」を押してください。プライベートウィンドウでも構いません。"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: palette.kimitoBlueSoft,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: { fontSize: 16, fontWeight: "800", color: color.textPrimary },
  body: { fontSize: 14, lineHeight: 20, color: color.textSecondary },
  button: {
    marginTop: spacing.xs,
    backgroundColor: palette.kimitoBlue,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  buttonText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 18, color: color.textMuted },
});
