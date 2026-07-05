/**
 * Static native sponsor card.
 *
 * No SDK, no animation, no autoplay. The "協賛" label is always visible.
 */

import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { borderRadius, color, contentMaxWidth, palette, spacing } from "@/theme/tokens";

export type SponsorCardData = {
  id: number;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  prefecture: string | null;
  municipality: string | null;
  sponsorLabel: "協賛";
};

type SponsorCardProps = {
  card: SponsorCardData;
  onPress?: (card: SponsorCardData) => void;
  testID?: string;
};

async function openSponsorUrl(url: string): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export function SponsorCard({ card, onPress, testID }: SponsorCardProps) {
  const areaLabel = [card.prefecture, card.municipality].filter(Boolean).join(" ");

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.headingRow}>
        <View style={styles.labelPill}>
          <Text style={styles.labelText}>{card.sponsorLabel}</Text>
        </View>
        {areaLabel ? (
          <Text style={styles.areaText} numberOfLines={1}>
            {areaLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.bodyRow}>
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel=""
        />
        <View style={styles.copyColumn}>
          <Text style={styles.title} numberOfLines={2}>
            {card.title}
          </Text>
          <Text style={styles.body} numberOfLines={3}>
            {card.body}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => {
          onPress?.(card);
          void openSponsorUrl(card.linkUrl);
        }}
        style={({ pressed }) => [
          styles.cta,
          pressed && { opacity: 0.85 },
          Platform.OS === "web" && styles.webCursor,
        ]}
        accessibilityRole="link"
        accessibilityLabel={`${card.title}を開く`}
      >
        <MaterialIcons name="open-in-new" size={17} color={color.accentIndigo} />
        <Text style={styles.ctaText}>詳しく見る</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    alignSelf: "center",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  labelPill: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: color.accentOrange,
    backgroundColor: color.accentOrange + "14",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  labelText: {
    color: color.accentOrange,
    fontSize: 12,
    fontWeight: "800",
  },
  areaText: {
    flex: 1,
    minWidth: 0,
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  bodyRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: borderRadius.md,
    backgroundColor: color.surfaceEmphasis,
    borderWidth: 1,
    borderColor: color.border,
  },
  copyColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  title: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  body: {
    color: color.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.accentIndigo + "66",
    backgroundColor: palette.kimitoBlueSoft,
  },
  ctaText: {
    color: color.accentIndigo,
    fontSize: 14,
    fontWeight: "800",
  },
  webCursor: {
    cursor: "pointer",
  } as const,
});
