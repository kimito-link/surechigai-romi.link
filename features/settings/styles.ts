// features/settings/styles.ts
// v6.18: 設定画面のスタイル定義
import { StyleSheet } from "react-native";
import { color, typography } from "@/theme/tokens";

export const settingsStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    color: color.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  sectionTitle: {
    color: color.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  currentAccount: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: color.borderAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: color.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  accountUsername: {
    color: color.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: color.successDark,
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  notLoggedIn: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  notLoggedInText: {
    color: color.textSubtle,
    fontSize: typography.fontSize.sm,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(221, 101, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    color: color.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  menuItemDescription: {
    color: color.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  savedAccountsPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  savedAccountsLabel: {
    color: color.textSubtle,
    fontSize: typography.fontSize.xs,
    marginRight: 8,
  },
  savedAccountsAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  savedAccountAvatar: {
    marginLeft: -8,
  },
  savedAccountAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.surfaceDark,
  },
  moreAccountsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.borderAlt,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: color.surfaceDark,
  },
  moreAccountsText: {
    color: color.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  logoutText: {
    color: color.danger,
  },
  sessionExpiryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  sessionExpiryText: {
    color: color.textMuted,
    fontSize: typography.fontSize.xs,
    marginLeft: 6,
  },
  sessionExpiryExpired: {
    color: color.danger,
  },
  footer: {
    padding: 24,
    paddingTop: 32,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: color.border,
    marginTop: 16,
  },
  footerLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  footerAppName: {
    color: color.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: "bold",
    marginLeft: 8,
  },
  footerVersion: {
    color: color.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: 4,
  },
  footerText: {
    color: color.textSubtle,
    fontSize: typography.fontSize.sm,
  },
  footerSubtext: {
    color: color.textSubtle,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(29, 161, 242, 0.1)",
  },
  footerLinkText: {
    color: color.twitter,
    fontSize: typography.fontSize.xs,
    marginLeft: 4,
  },
  footerCopyright: {
    color: color.textSubtle,
    fontSize: typography.fontSize.xs,
    marginTop: 16,
  },
});
