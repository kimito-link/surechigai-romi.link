import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { color } from "@/theme/tokens";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useResponsive } from "@/hooks/use-responsive";
import MaterialIcons from "@/lib/icons/material-icons";
import { Image } from "expo-image";
import { navigateBack } from "@/lib/navigation";

export default function SpecialThanksScreen() {
  const { isDesktop } = useResponsive();

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ===== 和テイストのクレジットバナー ===== */}
        <View style={styles.creditBanner}>
          <Text style={styles.creditTitle}>君斗りんくの{"\n"}すれ違ひ通信 v1.0.0</Text>
          <Text style={styles.creditReading}>SURECHIGAI TSUSHIN</Text>

          {/* 3キャラ */}
          <View style={styles.creditChars}>
            <Image source={require("@/assets/images/characters/konta.png")} style={styles.creditCharSide} contentFit="contain" />
            <Image source={require("@/assets/images/characters/rinku.png")} style={styles.creditCharMain} contentFit="contain" />
            <Image source={require("@/assets/images/characters/tanune.png")} style={styles.creditCharSide} contentFit="contain" />
          </View>

          {/* 等身大りんく（主役） */}
          <Image source={require("@/assets/images/characters/rinku-full.png")} style={styles.creditFull} contentFit="contain" />

          {/* ロゴ */}
          <Image source={require("@/assets/images/logos/kimitolink-logo.webp")} style={styles.creditLogo} contentFit="contain" />
          <Text style={styles.creditMaker}>制作　Kimito-Link Project</Text>
          <Text style={styles.creditMakerSub}>キミトリンクプロジェクト</Text>

          {/* 公式サイトリンク */}
          <Pressable
            style={({ pressed }) => [styles.officialLink, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL("https://kimito-link.com")}
          >
            <MaterialIcons name="public" size={16} color={color.accentAlt} style={{ marginRight: 8 }} />
            <Text style={styles.officialLinkText}>公式サイト kimito-link.com</Text>
          </Pressable>
        </View>

        {/* Terminal Window Wrapper */}
        <View style={styles.terminalCard}>
          {/* Header */}
          <View style={styles.terminalHeader}>
            <View style={styles.windowControls}>
              <View style={styles.dotRed} />
              <View style={styles.dotYellow} />
              <View style={styles.dotGreen} />
            </View>
            <Text style={styles.terminalTitle}>SYSTEM / SPECIAL_THANKS.exe</Text>
            <Pressable onPress={navigateBack} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={color.textWhite} />
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.terminalBody}>
            <View style={styles.heroSection}>
              <MaterialIcons name="code" size={48} color={color.accentPrimary} style={{ marginBottom: 16 }} />
              
              <Text style={styles.heroText}>
                「星野ロミさんから{"\n"}ソースコード頂きました」
              </Text>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <Text style={styles.cmdText}>
                <Text style={styles.prompt}>$</Text> fetch --provider
              </Text>
              <Text style={styles.infoText}>
                Provider: <Text style={styles.highlightText}>星野ロミ (Hoshino Romi)</Text>
              </Text>
              
              <Text style={styles.cmdText}>
                <Text style={styles.prompt}>$</Text> view --message
              </Text>
              <Text style={styles.infoText}>
                本アプリケーション「Kimito-link（君斗りんくのすれ違ひ通信）」のベースとなるソースコードおよび、基本的なハッカー/サイバーパンクの世界観のアイデアをご提供いただきました。{"\n"}
                クリエイター同士のすれ違い体験を実現するための基礎技術として、多大なるご協力をいただきました。この場を借りて深く感謝申し上げます。
              </Text>

              <Text style={styles.cmdText}>
                <Text style={styles.prompt}>$</Text> fetch --characters
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.highlightText}>リンク (Rinku)</Text> - Operator / Linker{"\n"}
                <Text style={styles.highlightText}>コンタ (Konta)</Text> - Fox agent{"\n"}
                <Text style={styles.highlightText}>タヌネ (Tanune)</Text> - Raccoon dog agent
              </Text>

              <Text style={styles.cmdText}>
                <Text style={styles.prompt}>$</Text> status
              </Text>
              <Text style={styles.infoTextSuccess}>
                ✓ SYSTEM_INTEGRATION_COMPLETE
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          onPress={navigateBack}
        >
          <Text style={styles.backButtonText}>[ 戻る ]</Text>
        </Pressable>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingTop: 48,
    gap: 32,
    alignItems: "center",
    minHeight: "100%",
  },
  // 和テイストのクレジットバナー（和紙トーン）
  creditBanner: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#f3efe3",
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  creditTitle: {
    color: "#2b2820",
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 52,
    letterSpacing: 6,
    textAlign: "center",
  },
  creditReading: {
    color: "#9a8f7a",
    fontSize: 11,
    letterSpacing: 6,
    marginTop: 12,
    fontFamily: "monospace",
  },
  creditChars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
  },
  creditCharMain: { width: 92, height: 92 },
  creditCharSide: { width: 76, height: 76 },
  creditFull: {
    width: 220,
    height: 335,
    marginTop: 20,
  },
  creditLogo: {
    width: 200,
    height: 64,
    marginTop: 16,
  },
  creditMaker: {
    color: "#3a352c",
    fontSize: 15,
    letterSpacing: 2,
    marginTop: 12,
  },
  creditMakerSub: {
    color: "#9a8f7a",
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 4,
  },
  officialLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,66,123,0.3)",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  officialLinkText: {
    color: "#00427b",
    fontSize: 14,
    fontWeight: "600",
  },
  terminalCard: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "rgba(13, 17, 23, 0.95)",
    borderColor: color.accentPrimary,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: color.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    overflow: "hidden",
  },
  terminalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 95, 86, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.accentPrimary,
  },
  windowControls: {
    flexDirection: "row",
    alignItems: "center",
    width: 60, // Fixed width to keep title centered
  },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FF5F56", marginRight: 8 },
  dotYellow: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFBD2E", marginRight: 8 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#27C93F" },
  terminalTitle: {
    color: color.accentPrimary,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    width: 60, // Fixed width to keep title centered
    alignItems: "flex-end",
  },
  terminalBody: {
    padding: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  heroText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 36,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 24,
  },
  detailsSection: {
    gap: 16,
  },
  cmdText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  prompt: {
    color: color.accentPrimary,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 14,
    fontFamily: "monospace",
    lineHeight: 24,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 8,
  },
  infoTextSuccess: {
    color: color.success,
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "bold",
    paddingLeft: 12,
  },
  highlightText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
});
