/**
 * features/events/components/participation-form/styles.ts
 * 
 * ParticipationFormコンポーネントのスタイル定義
 */
import { StyleSheet } from "react-native";
import { color } from "@/theme/tokens";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loginPrompt: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 32,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  alreadyParticipated: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 32,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.success,
  },
  alreadyParticipatedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  alreadyParticipatedSubtitle: {
    color: color.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: color.bg,
    borderRadius: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userHandle: {
    color: color.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  userFollowers: {
    color: color.accentPrimary,
    fontSize: 12,
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: color.border,
  },
  selectButton: {
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  prefectureList: {
    backgroundColor: color.bg,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: color.border,
    maxHeight: 200,
  },
  prefectureScroll: {
    padding: 12,
  },
  prefectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prefectureItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: color.surface,
  },
  prefectureItemActive: {
    backgroundColor: color.accentPrimary,
  },
  prefectureItemText: {
    fontSize: 13,
  },
  genderButtons: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  companionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addCompanionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addCompanionButtonText: {
    color: color.accentPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  addCompanionForm: {
    backgroundColor: color.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  addCompanionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  twitterSearchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  twitterSearchInput: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  twitterSearchInputSuccess: {
    borderColor: color.success,
  },
  twitterSearchButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  twitterSearchButtonDisabled: {
    opacity: 0.5,
  },
  twitterSearchButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lookupError: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  lookupErrorText: {
    color: color.danger,
    fontSize: 14,
    marginLeft: 8,
  },
  lookedUpProfile: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.success,
  },
  lookedUpProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  lookedUpProfileInfo: {
    flex: 1,
  },
  lookedUpProfileName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lookedUpProfileUsername: {
    color: color.twitter,
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: color.border,
  },
  dividerText: {
    color: color.textHint,
    fontSize: 12,
    marginHorizontal: 12,
  },
  nameInput: {
    backgroundColor: color.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: 12,
  },
  addCompanionActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: color.border,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: color.textSecondary,
  },
  confirmAddButton: {
    flex: 1,
    backgroundColor: color.accentPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  confirmAddButtonDisabled: {
    backgroundColor: color.border,
  },
  confirmAddButtonText: {
    fontWeight: "bold",
  },
  companionList: {
    gap: 8,
  },
  companionItem: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  companionItemWithTwitter: {
    borderColor: color.twitter,
  },
  companionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  companionAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  companionAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 14,
    fontWeight: "600",
  },
  companionHandle: {
    color: color.textSecondary,
    fontSize: 12,
  },
  removeCompanionButton: {
    padding: 8,
  },
  contributionDisplay: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contributionLabel: {
    color: color.textSecondary,
    fontSize: 14,
  },
  contributionValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  contributionNumber: {
    color: color.accentPrimary,
    fontSize: 24,
    fontWeight: "bold",
  },
  contributionUnit: {
    color: color.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  videoPermission: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  videoPermissionText: {
    fontSize: 14,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  attendanceTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: color.border,
  },
  attendanceTypeButtonActive: {
    borderColor: color.accentPrimary,
  },
  attendanceTypeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  attendanceTypeHint: {
    fontSize: 12,
    color: color.textHint,
    marginTop: 4,
    lineHeight: 16,
  },
});
