import { View, Text, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

/** Web PC 用 — 規約リンクの軽量フッター */
export function WebAppFooter() {
  const sideNav = useWebSideNavActive();
  if (Platform.OS !== "web" || !sideNav) return null;

  return (
    <View style={[styles.footer, { left: WEB_SIDE_NAV_WIDTH }]}>
      <Pressable
        onPress={() => Linking.openURL("https://surechigai-romi.link/terms")}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>利用規約</Text>
      </Pressable>
      <Text style={styles.sep}>·</Text>
      <Pressable
        onPress={() => Linking.openURL("https://surechigai-romi.link/privacy")}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.linkText}>プライバシーポリシー</Text>
      </Pressable>
    </View>
  );
}

export const WEB_APP_FOOTER_HEIGHT = 36;

const styles = StyleSheet.create({
  footer: {
    position: "fixed" as unknown as "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: WEB_APP_FOOTER_HEIGHT,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: 8,
  },
  link: {
    padding: 4,
  },
  linkText: {
    fontSize: 11,
    color: color.textMuted,
    textDecorationLine: "underline",
  },
  sep: {
    fontSize: 11,
    color: color.textMuted,
  },
});
