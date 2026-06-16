import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import { AppHeader } from "@/components/organisms/app-header";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useResponsive } from "@/hooks/use-responsive";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function SpecialThanksScreen() {
  const { isDesktop } = useResponsive();
  const router = useRouter();

  return (
    <ScreenContainer containerClassName="bg-background">
      <AppHeader title="Special Thanks" showCharacters={false} isDesktop={isDesktop} />

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="code" size={24} color={color.accentAlt} />
            <Text style={styles.cardTitle}>Source Code Provider</Text>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.name}>星野ロミ (Hoshino Romi)</Text>
            <Text style={styles.description}>
              本アプリケーション「Kimito-link（すれちがいロミ）」のベースとなるソースコードおよび、基本的なハッカー/サイバーパンクの世界観のアイデアをご提供いただきました。{"\n"}
              クリエイター同士のすれ違い体験を実現するための基礎技術として、多大なるご協力をいただきました。この場を借りて深く感謝申し上げます。
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="groups" size={24} color={color.accentIndigo} />
            <Text style={styles.cardTitle}>Characters</Text>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.description}>
              リンク (Rinku){"\n"}
              コンタ (Konta){"\n"}
              タヌネ (Tanune)
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </Pressable>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: color.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    gap: 12,
  },
  cardTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  cardBody: {
    padding: 20,
    gap: 12,
  },
  name: {
    color: color.accentPrimary,
    fontSize: 22,
    fontWeight: "bold",
  },
  description: {
    color: color.textSecondary,
    fontSize: 14,
    lineHeight: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.border,
    marginTop: 16,
  },
  backButtonText: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
});
