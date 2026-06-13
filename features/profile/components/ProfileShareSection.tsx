/**
 * features/profile/components/ProfileShareSection.tsx
 * プロフィール共有エリア
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { color } from "@/theme/tokens";
import { navigate } from "@/lib/navigation";
import { ShareButton } from "@/components/molecules/share-button";

interface ProfileShareSectionProps {
  profileShareUrl: string | null;
  isOwnProfile: boolean;
  onShare: () => Promise<boolean>;
}

export const ProfileShareSection = ({
  profileShareUrl,
  isOwnProfile,
  onShare,
}: ProfileShareSectionProps) => {
  if (profileShareUrl) {
    return (
      <View style={styles.area}>
        <ShareButton
          onPress={onShare}
          label={isOwnProfile ? "自分のプロフィールをシェア" : "このプロフィールをシェア"}
          size="large"
        />
        <Text selectable style={styles.url}>
          共有URL: {profileShareUrl}
        </Text>
      </View>
    );
  }

  if (isOwnProfile) {
    return (
      <View style={styles.area}>
        <Text style={styles.hint}>
          Twitter（X）連携するとプロフィールを共有できます
        </Text>
        <Pressable
          onPress={() => navigate.toSettings()}
          style={styles.settingsLink}
          accessibilityRole="button"
          accessibilityLabel="設定画面でTwitter連携する"
        >
          <Text style={styles.settingsLinkText}>設定で連携する</Text>
        </Pressable>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  area: {
    backgroundColor: color.surface,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  url: {
    marginTop: 8,
    fontSize: 12,
    color: color.textMuted,
  },
  hint: {
    color: color.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  settingsLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.accentPrimaryAA,
  },
  settingsLinkText: {
    color: color.accentPrimaryAA,
    fontSize: 14,
    fontWeight: "600",
  },
});
