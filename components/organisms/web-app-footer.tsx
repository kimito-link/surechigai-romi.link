import { View, Text, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { color } from "@/theme/tokens";
import { BrandStamp } from "@/components/brand/brand-stamp";
import { useWebSideNavActive, WEB_SIDE_NAV_WIDTH } from "@/components/organisms/web-side-nav";

/** Web 用 — ブランド + 規約リンクの軽量フッター（操作を邪魔しない高さ） */
export function WebAppFooter() {
  const sideNav = useWebSideNavActive();
  if (Platform.OS !== "web") return null;

  return (
    <View style={[styles.footer, { left: sideNav ? WEB_SIDE_NAV_WIDTH : 0 }]}>
      <BrandStamp variant="footer" />
      <View style={styles.links}>
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
          <Text style={styles.linkText}>プライバシー</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const WEB_APP_FOOTER_HEIGHT = 40;

const styles = StyleSheet.create({
  footer: {
    position: "fixed" as unknown as "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: WEB_APP_FOOTER_HEIGHT,
    paddingHorizontal: 12,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
    gap: 12,
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
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
