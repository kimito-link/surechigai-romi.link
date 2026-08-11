/**
 * components/legal/legal-page.tsx
 *
 * プライバシーポリシー / 利用規約 / データ削除 / サポート の共通レイアウト。
 *
 * これらのURLは app.config.json の contact に登録され、App Store / Google Play の
 * 審査に提出される。到達できないと Metadata Rejected の直接要因になるため、
 * SPA のルートとして実在させる（2026-07-30 時点では未実装で 404 だった）。
 *
 * 文面は「実装の実態」と一致させること。実態と異なる開示は Guideline 5.1.1/5.1.2 違反になる。
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Platform } from "react-native";
import Head from "expo-router/head";
import { color } from "@/theme/tokens";
import { ScreenContainer } from "@/components/organisms/screen-container";
import MaterialIcons from "@/lib/icons/material-icons";
import { navigateBack } from "@/lib/navigation";
import appConfig from "@/app.config.json";

/** 見出し + 本文のひとかたまり */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** 本文の段落 */
export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

/** 箇条書きの1項目 */
export function LegalBullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>・</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

/** 特に読み落としてほしくない事実を囲う枠 */
export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.callout}>
      <MaterialIcons name="info" size={18} color={color.accentPrimary} />
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

/** メール等の外部リンク */
export function LegalLink({ url, label }: { url: string; label: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

/**
 * 問い合わせ先。LINE を主、メールを従として並べる。
 *
 * 連絡先は app.config.json の contact を **唯一の正本**にする。
 * 4つの法務ページ（privacy / terms / deletion / support）に同じ値を
 * ハードコードしていたため、変更漏れが起きる状態だった。
 *
 * メールは残す。両ストアのデベロッパー連絡先として必須なうえ、
 * データの開示・削除の請求は記録に残る手段を用意しておくのが安全なため。
 */
export function LegalContact() {
  const line = appConfig.contact.lineUrl;
  const lineId = appConfig.contact.lineId;
  const email = appConfig.contact.email;

  return (
    <>
      <LegalParagraph>
        公式LINEからお気軽にご連絡ください。メールでも受け付けています。
      </LegalParagraph>
      {line ? <LegalLink url={line} label={`公式LINE（${lineId}）`} /> : null}
      <LegalLink url={`mailto:${email}`} label={email} />
    </>
  );
}

export function LegalPage({
  title,
  updatedAt,
  description,
  children,
}: {
  title: string;
  /** 最終更新日（YYYY年M月D日） */
  updatedAt: string;
  /** ページ固有の meta description（審査で個別に開かれるため用意する） */
  description: string;
  children: React.ReactNode;
}) {
  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "bottom"]}>
      {/* 審査担当者や検索エンジンが各ページを個別に開くため、タイトルを固有にする */}
      {Platform.OS === "web" ? (
        <Head>
          <title>{`${title}｜君斗りんくのすれ違ひ通信`}</title>
          <meta name="description" content={description} />
        </Head>
      ) : null}
      <View style={styles.header}>
        <Pressable
          onPress={navigateBack}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <MaterialIcons name="arrow-back" size={24} color={color.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.updatedAt}>最終更新: {updatedAt}</Text>
          {children}
          <Text style={styles.footer}>
            君斗りんくのすれ違ひ通信{"\n"}
            Kimito-Link Project / Best Trust
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: color.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,66,123,0.18)",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: color.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,66,123,0.12)",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: color.textPrimary,
    marginBottom: 6,
  },
  updatedAt: {
    fontSize: 13,
    color: color.textMuted,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: color.accentPrimary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 25,
    color: color.textPrimary,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingRight: 4,
  },
  bulletMark: {
    fontSize: 15,
    lineHeight: 25,
    color: color.textSecondary,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 25,
    color: color.textPrimary,
  },
  callout: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: color.surfaceEmphasis,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 23,
    color: color.textPrimary,
    fontWeight: "600",
  },
  link: {
    // タップ標的は 44px 以上（Apple HIG / WCAG 2.5.5）。
    // 実測監査で 52x24 しか無く、指で押しにくい状態だった（2026-08-01）。
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 15,
    lineHeight: 25,
    color: color.accentAlt,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,66,123,0.12)",
    fontSize: 13,
    lineHeight: 21,
    color: color.textMuted,
    textAlign: "center",
  },
});
