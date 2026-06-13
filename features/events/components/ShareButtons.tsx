import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { Button } from "@/components/ui/button";

export type ShareButtonsProps = {
  onShare: () => void;
  onTwitterShare: () => void;
  onShareWithOgp: () => void;
  isGeneratingOgp: boolean;
};

export function ShareButtons({
  onShare,
  onTwitterShare,
  onShareWithOgp,
  isGeneratingOgp,
}: ShareButtonsProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        このチャレンジをシェア
      </Text>
      <View style={styles.buttons}>
        <Button
          variant="primary"
          onPress={onShare}
          style={styles.shareButton}
        >
          <MaterialIcons name="share" size={20} color={colors.foreground} />
          <Text style={[styles.shareButtonText, { color: colors.foreground }]}>シェア</Text>
        </Button>
        
        <Button
          variant="primary"
          onPress={onTwitterShare}
          style={[styles.shareButton, styles.twitterButton]}
        >
          <MaterialIcons name="tag" size={20} color={colors.foreground} />
          <Text style={[styles.shareButtonText, { color: colors.foreground }]}>X投稿</Text>
        </Button>
        
        <Button
          variant="primary"
          onPress={onShareWithOgp}
          disabled={isGeneratingOgp}
          loading={isGeneratingOgp}
          style={[styles.shareButton, styles.ogpButton]}
        >
          <MaterialIcons name="image" size={20} color={colors.foreground} />
          <Text style={[styles.shareButtonText, { color: colors.foreground }]}>
            {isGeneratingOgp ? "生成中..." : "OGP付き"}
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    backgroundColor: color.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: color.accentPrimary,
  },
  twitterButton: {
    backgroundColor: color.twitter,
  },
  ogpButton: {
    backgroundColor: color.accentAlt,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
