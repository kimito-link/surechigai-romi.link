/**
 * preview-content.styles.ts
 * 
 * PreviewContent????????????????
 * v6.35: ?????????????
 */
import { StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";

export const styles = StyleSheet.create({
  // ?????????????
  previewContainer: {
    backgroundColor: palette.white + "1A",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  
  // Map preview
  mapPreview: {
    width: "100%",
  },
  mapHeader: {
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  mapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mapRegion: {
    width: "48%",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  mapRegionName: {
    fontSize: 10,
    color: color.textWhite,
    marginBottom: 4,
  },
  mapRegionCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
  },
  
  // Participant preview
  participantRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  participantCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 12,
    padding: 12,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  participantInitial: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
  participantName: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  participantPref: {
    fontSize: 10,
    color: palette.white + "B3",
    marginTop: 2,
  },
  
  // Chart preview
  chartPreview: {
    width: "100%",
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 80,
    gap: 8,
  },
  chartBarItem: {
    flex: 1,
    alignItems: "center",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 4,
    marginBottom: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: palette.white + "B3",
  },
  
  // Notification preview
  notificationPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.textWhite,
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.accentPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.overlayDark,
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 12,
    color: color.textMuted,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: color.textMuted,
  },
  
  // Crown preview
  badgePreview: {
    alignItems: "center",
  },
  crownIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.rankGold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  crownEmoji: {
    fontSize: 32,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 12,
    color: palette.white + "B3",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badgeItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: palette.white + "1A",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeItemLocked: {
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    color: color.textWhite,
    textAlign: "center",
  },
  
  // Comment preview
  commentPreview: {
    backgroundColor: palette.white + "1A",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  commentName: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 10,
    color: palette.white + "80",
  },
  commentText: {
    color: color.textWhite,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Invite preview
  invitePreview: {
    alignItems: "center",
    width: "100%",
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
  },
  inviteCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonActive: {
    backgroundColor: color.accentPrimary,
  },
  inviteButtonText: {
    color: color.textWhite,
    fontSize: 20,
    fontWeight: "bold",
  },
  inviteButtonTextActive: {
    color: color.textWhite,
  },
  inviteCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textWhite,
    minWidth: 40,
    textAlign: "center",
  },
  inviteDesc: {
    fontSize: 12,
    color: palette.white + "B3",
  },
  
  // Form preview
  formPreview: {
    backgroundColor: palette.white + "1A",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    color: palette.white + "B3",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.white + "33",
  },
  formInputText: {
    fontSize: 14,
    color: color.textWhite,
  },
  formSelect: {
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.white + "33",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formSelectText: {
    fontSize: 14,
    color: color.textWhite,
  },
  formSelectArrow: {
    fontSize: 12,
    color: palette.white + "80",
  },
  
  // Prefecture preview
  prefectureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  prefectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prefectureButton: {
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.white + "33",
  },
  prefectureButtonSelected: {
    backgroundColor: color.accentPrimary,
    borderColor: color.accentPrimary,
  },
  prefectureText: {
    fontSize: 14,
    color: palette.white + "B3",
  },
  prefectureTextSelected: {
    color: color.textWhite,
    fontWeight: "bold",
  },
  
  // Profile preview
  profilePreview: {
    backgroundColor: palette.white + "1A",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileAvatarText: {
    color: color.textWhite,
    fontSize: 20,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 12,
    color: palette.white + "B3",
    marginTop: 2,
  },
  profileFollowers: {
    fontSize: 11,
    color: palette.white + "B3",
    marginTop: 4,
  },
  influencerBadge: {
    backgroundColor: palette.gold + "33",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  influencerBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: color.rankGold,
  },
  followButton: {
    backgroundColor: color.accentPrimary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  followButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // Gender preview
  genderPreview: {
    width: "100%",
  },
  genderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  genderChart: {
    flexDirection: "row",
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  genderBar: {
    justifyContent: "center",
    alignItems: "center",
  },
  genderText: {
    color: color.textWhite,
    fontSize: 12,
    fontWeight: "bold",
  },
  genderLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  genderLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  genderLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  genderLegendText: {
    fontSize: 12,
    color: palette.white + "B3",
  },
  
  // Challenge card preview
  challengeCardPreview: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: palette.pink500 + "80",
  },
  challengeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  challengeCardCategory: {
    fontSize: 12,
    color: color.accentPrimary,
    backgroundColor: palette.pink500 + "33",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  challengeCardDays: {
    fontSize: 12,
    color: color.textWhite,
    backgroundColor: palette.white + "33",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  challengeCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 8,
  },
  challengeCardHost: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  challengeCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.accentPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  challengeCardAvatarText: {
    color: color.textWhite,
    fontSize: 10,
    fontWeight: "bold",
  },
  challengeCardHostName: {
    fontSize: 12,
    color: palette.white + "CC",
  },
  challengeCardProgress: {
    marginTop: 12,
  },
  challengeCardProgressBar: {
    height: 8,
    backgroundColor: palette.white + "33",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  challengeCardProgressFill: {
    height: "100%",
    backgroundColor: color.accentPrimary,
    borderRadius: 4,
  },
  challengeCardProgressText: {
    fontSize: 12,
    color: color.textWhite,
    textAlign: "right",
  },
  
  // Progress bar preview
  progressBarPreview: {
    width: "100%",
  },
  progressBarTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 16,
    backgroundColor: palette.white + "33",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: color.accentPrimary,
    borderRadius: 8,
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBarCurrent: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.textWhite,
  },
  progressBarGoal: {
    fontSize: 16,
    color: palette.white + "B3",
  },
  progressBarMilestones: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  progressBarMilestone: {
    backgroundColor: palette.white + "1A",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBarMilestoneCompleted: {
    backgroundColor: palette.green400 + "4D",
  },
  progressBarMilestoneText: {
    fontSize: 10,
    color: color.textWhite,
    fontWeight: "bold",
  },
  
  // Countdown preview
  countdownPreview: {
    alignItems: "center",
    width: "100%",
  },
  countdownTitle: {
    fontSize: 14,
    color: palette.white + "B3",
    marginBottom: 12,
  },
  countdownNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  countdownItem: {
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
    minWidth: 50,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textWhite,
  },
  countdownLabel: {
    fontSize: 10,
    color: palette.white + "B3",
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.white + "80",
  },
  countdownDate: {
    fontSize: 12,
    color: palette.white + "B3",
  },
  
  // Achievement preview
  achievementPreview: {
    alignItems: "center",
    width: "100%",
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.rankGold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
    color: palette.white + "B3",
    marginBottom: 12,
  },
  achievementNames: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  achievementName: {
    fontSize: 12,
    color: color.textWhite,
    backgroundColor: palette.white + "1A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  achievementMore: {
    fontSize: 12,
    color: palette.white + "80",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  // Share preview
  sharePreview: {
    width: "100%",
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  shareButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  shareButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  shareCard: {
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
  },
  shareCardText: {
    color: color.textWhite,
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Ranking preview
  rankingPreview: {
    width: "100%",
  },
  rankingTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  rankingList: {
    gap: 8,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
  },
  rankingItemHighlight: {
    backgroundColor: palette.pink500 + "4D",
    borderWidth: 1,
    borderColor: color.accentPrimary,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    width: 30,
    textAlign: "center",
  },
  rankingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  rankingAvatarText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  rankingName: {
    flex: 1,
    fontSize: 12,
    color: color.textWhite,
    fontWeight: "600",
  },
  rankingScore: {
    fontSize: 12,
    color: color.accentPrimary,
    fontWeight: "bold",
  },
  
  // DM preview
  dmPreview: {
    width: "100%",
  },
  dmTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  dmMessages: {
    gap: 8,
  },
  dmMessageReceived: {
    backgroundColor: palette.white + "1A",
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  dmMessageSent: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 12,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  dmMessageText: {
    fontSize: 12,
    color: color.textWhite,
    lineHeight: 18,
  },
  
  // Reminder preview
  reminderPreview: {
    width: "100%",
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  reminderOptions: {
    gap: 12,
  },
  reminderOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
  },
  reminderOptionText: {
    fontSize: 12,
    color: color.textWhite,
  },
  reminderToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.white + "33",
    padding: 2,
  },
  reminderToggleOn: {
    backgroundColor: color.accentPrimary,
  },
  reminderToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: color.textWhite,
  },
  
  // Ticket preview
  ticketPreview: {
    width: "100%",
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  ticketList: {
    gap: 8,
    marginBottom: 12,
  },
  ticketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
  },
  ticketType: {
    fontSize: 12,
    color: color.textWhite,
  },
  ticketPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  ticketButton: {
    backgroundColor: color.accentPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  ticketButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // Cheer preview
  cheerPreview: {
    width: "100%",
  },
  cheerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  cheerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  cheerButton: {
    alignItems: "center",
    backgroundColor: palette.white + "1A",
    borderRadius: 12,
    padding: 12,
  },
  cheerEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  cheerCount: {
    fontSize: 12,
    color: color.textWhite,
    fontWeight: "bold",
  },
  
  // Stats preview
  statsPreview: {
    width: "100%",
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statsItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: palette.white + "1A",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textWhite,
  },
  statsLabel: {
    fontSize: 10,
    color: palette.white + "B3",
    marginTop: 4,
  },
  
  // Celebration preview
  celebrationPreview: {
    alignItems: "center",
    width: "100%",
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 14,
    color: palette.white + "B3",
    marginBottom: 16,
  },
  celebrationConfetti: {
    flexDirection: "row",
    gap: 8,
  },
  confettiItem: {
    fontSize: 24,
  },
});
