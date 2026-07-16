/**
 * mypage-authenticated-screen.tsx から切り出したスタイル定義。
 * mypage-screen-view.tsx と hitokoto-modal.tsx の両方から参照される。
 */
import { StyleSheet } from "react-native";
import { color, palette, contentMaxWidth } from "@/theme/tokens";

export const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: color.textMuted,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    alignItems: "center",
  },
  pageBody: {
    width: "100%",
    maxWidth: contentMaxWidth.standard,
    gap: 12,
  },
  // Profile card
  profileCard: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  publicPagePreviewLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
  },
  publicPagePreviewText: {
    color: color.accentIndigo,
    fontSize: 13,
    fontWeight: "700",
  },
  precisionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  precisionTitle: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  precisionSub: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  visibilitySection: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  visibilityHeading: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  visibilityNote: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  visibilityOptionSelected: {
    borderColor: palette.kimitoBlue,
    backgroundColor: palette.kimitoBlue + "12",
  },
  visibilityTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  visibilityTitleSelected: {
    color: palette.kimitoBlue,
  },
  visibilitySub: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  profileUsername: {
    color: color.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  profileMetaText: {
    color: color.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  // Section
  section: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  settingsBody: {
    gap: 12,
    marginTop: 8,
  },
  settingsSubSection: {
    gap: 4,
    marginTop: 4,
  },
  settingsSubHeading: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: color.accentIndigo + "22",
  },
  editButtonText: {
    color: color.accentIndigo,
    fontSize: 12,
    fontWeight: "600",
  },
  hitokotoDisplay: {
    color: color.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  hitokotoNote: {
    color: color.textMuted,
    fontSize: 11,
  },
  // Block list
  blockListContent: {
    paddingVertical: 8,
  },
  blockListEmpty: {
    color: color.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  blockedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    color: color.textPrimary,
    fontSize: 14,
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
  },
  unblockButtonText: {
    color: color.textMuted,
    fontSize: 12,
  },
  // Menu items
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  dangerItem: {
    backgroundColor: color.danger + "11",
  },
  dangerZoneDivider: {
    height: 1,
    backgroundColor: color.border,
    marginVertical: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Legal
  legalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  legalLink: {
    padding: 4,
  },
  legalLinkText: {
    color: color.textMuted,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalSep: {
    color: color.textMuted,
    fontSize: 12,
  },
  version: {
    color: color.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "CC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hitokotoModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  hitokotoModalTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  hitokotoHint: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  hitokotoInput: {
    backgroundColor: color.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    color: color.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: color.border,
  },
  presetLabel: {
    color: color.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceAlt,
  },
  presetChipText: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  hitokotoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hitokotoCount: {
    color: color.textMuted,
    fontSize: 12,
  },
  hitokotoError: {
    color: color.danger,
    fontSize: 12,
  },
  hitokotoButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: color.textMuted,
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: color.accentIndigo,
    alignItems: "center",
  },
  saveButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  // Login gate
  loginGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loginGateTitle: {
    color: color.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.black,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  loginButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
});
