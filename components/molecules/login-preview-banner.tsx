/**
 * ログイン誘導バナー（プレビュー画面の先頭に置く）
 */
import { View, Text, StyleSheet } from "react-native";
import { LoginPreviewBannerExtras, type LoginPreviewBenefit } from "@/components/molecules/login-preview-banner-extras";
import { palette } from "@/theme/tokens";

export type { LoginPreviewBenefit };

const DEFAULT_BENEFITS: LoginPreviewBenefit[] = [
  { icon: "place", label: "足あとを正確に残せる" },
  { icon: "groups", label: "通りすがりの人とすれ違える" },
  { icon: "ios-share", label: "現在地をXでシェアできる" },
];

interface LoginPreviewBannerProps {
  headline: string;
  benefits?: LoginPreviewBenefit[];
}

export function LoginPreviewBanner({ headline, benefits = DEFAULT_BENEFITS }: LoginPreviewBannerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.headline}>{headline}</Text>
      <LoginPreviewBannerExtras benefits={benefits} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: "#00427B22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headline: {
    color: palette.kimitoBlue,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
});
