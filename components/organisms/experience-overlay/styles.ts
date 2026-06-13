/**
 * experience-overlay/styles.ts
 * 
 * 経験値オーバーレイのスタイル定義
 */
import { StyleSheet, Dimensions } from "react-native";
import { color, palette } from "@/theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.textWhite,
  },
  stepTitle: {
    fontSize: 12,
    color: color.hotPink,
    marginTop: 4,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.white + "33", // 20% opacity
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: color.textWhite,
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressBarWrapper: {
    flex: 1,
    height: 4,
    backgroundColor: palette.white + "33", // 20% opacity
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFillHeader: {
    height: "100%",
    backgroundColor: color.hotPink,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: palette.white + "99", // 60% opacity
    minWidth: 50,
    textAlign: "right",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    alignItems: "center",
  },
  characterSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    width: "100%",
  },
  characterContainer: {
    marginRight: 12,
  },
  characterImage: {
    width: 80,
    height: 80,
  },
  thoughtBubble: {
    flex: 1,
    backgroundColor: palette.white + "26", // 15% opacity
    borderRadius: 16,
    padding: 12,
    position: "relative",
  },
  thoughtTail: {
    position: "absolute",
    left: -8,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "transparent",
    borderRightWidth: 8,
    borderRightColor: palette.white + "26",
  },
  thoughtText: {
    fontSize: 14,
    color: color.textWhite,
    lineHeight: 22,
    fontStyle: "italic",
  },
  speechBubble: {
    backgroundColor: color.textWhite,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: SCREEN_WIDTH - 60,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.overlayDark,
    textAlign: "center",
  },
  subMessageText: {
    fontSize: 14,
    color: palette.white + "CC", // 80% opacity
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  previewContainer: {
    backgroundColor: palette.white + "1A", // 10% opacity
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
    borderRadius: 8,
    padding: 12,
    minWidth: 70,
    alignItems: "center",
  },
  mapRegionName: {
    fontSize: 12,
    color: color.textWhite,
    fontWeight: "bold",
  },
  mapRegionCount: {
    fontSize: 16,
    color: color.textWhite,
    fontWeight: "bold",
    marginTop: 4,
  },
  
  // Participant styles
  participantRow: {
    flexDirection: "row",
    gap: 8,
  },
  participantCard: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    minWidth: 80,
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
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
  },
  participantName: {
    fontSize: 12,
    color: color.textWhite,
    fontWeight: "bold",
  },
  participantPref: {
    fontSize: 10,
    color: palette.white + "B3", // 70% opacity
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
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
  chartBarItem: {
    alignItems: "center",
  },
  chartBarFill: {
    width: 40,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: palette.white + "B3", // 70% opacity
  },
  
  // Notification preview
  notificationPreview: {
    backgroundColor: color.textWhite,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.accentPrimary,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.overlayDark,
  },
  notificationBody: {
    fontSize: 12,
    color: palette.gray600,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: palette.gray500,
    marginTop: 4,
  },
  
  // Badge/Crown preview
  badgePreview: {
    alignItems: "center",
    width: "100%",
  },
  crownIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    color: palette.white + "B3", // 70% opacity
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 12,
  },
  badgeItem: {
    alignItems: "center",
    padding: 12,
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 12,
    minWidth: 70,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    color: color.textWhite,
  },
  
  // Comment preview
  commentPreview: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 320,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
  },
  commentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  commentTime: {
    fontSize: 10,
    color: palette.white + "80", // 50% opacity
  },
  commentText: {
    fontSize: 14,
    color: color.textWhite,
    lineHeight: 22,
  },
  
  // Invite preview
  invitePreview: {
    alignItems: "center",
    width: "100%",
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 16,
  },
  inviteCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white + "33", // 20% opacity
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonActive: {
    backgroundColor: color.successLight,
  },
  inviteButtonText: {
    fontSize: 24,
    color: color.textWhite,
    fontWeight: "bold",
  },
  inviteButtonTextActive: {
    color: color.overlayDark,
  },
  inviteCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: color.successLight,
  },
  inviteDesc: {
    fontSize: 12,
    color: palette.white + "B3", // 70% opacity
  },
  
  // Form preview
  formPreview: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 320,
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    color: palette.white + "B3", // 70% opacity
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: palette.white + "1A", // 10% opacity
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
    backgroundColor: palette.white + "1A", // 10% opacity
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
    color: palette.white + "80", // 50% opacity
  },
  
  // Prefecture preview
  prefectureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
  },
  prefectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  prefectureButton: {
    backgroundColor: palette.white + "1A", // 10% opacity
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
    color: palette.white + "B3", // 70% opacity
  },
  prefectureTextSelected: {
    fontSize: 14,
    color: color.textWhite,
    fontWeight: "bold",
  },
  
  // Profile preview
  profilePreview: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 320,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: color.textWhite,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  profileBio: {
    fontSize: 12,
    color: palette.white + "B3", // 70% opacity
    marginTop: 2,
  },
  profileFollowers: {
    fontSize: 12,
    color: color.rankGold,
    marginTop: 4,
  },
  influencerBadge: {
    backgroundColor: palette.gold + "33", // 20% opacity
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  influencerBadgeText: {
    fontSize: 10,
    color: color.rankGold,
    fontWeight: "bold",
  },
  followButton: {
    backgroundColor: color.twitter,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  
  // Gender preview
  genderPreview: {
    width: "100%",
    maxWidth: 320,
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
    fontSize: 12,
    fontWeight: "bold",
    color: color.textWhite,
  },
  genderLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
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
    color: palette.white + "B3", // 70% opacity
  },
  
  // Challenge card preview
  challengeCardPreview: {
    // Note: LinearGradientはコンポーネント側で設定されるため、ここでは背景色のみ
    backgroundColor: palette.pink500, // グラデーションの開始色
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: palette.pink500 + "80", // 50% opacity
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
    backgroundColor: palette.pink500 + "33", // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  challengeCardDays: {
    fontSize: 12,
    color: color.textWhite,
    backgroundColor: palette.white + "33", // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  challengeCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
  },
  challengeCardHost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  challengeCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  challengeCardAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: color.textWhite,
  },
  challengeCardHostName: {
    fontSize: 12,
    color: palette.white + "CC", // 80% opacity
  },
  challengeCardProgress: {
    gap: 8,
  },
  challengeCardProgressBar: {
    height: 8,
    backgroundColor: palette.white + "33", // 20% opacity
    borderRadius: 4,
    overflow: "hidden",
  },
  challengeCardProgressFill: {
    height: "100%",
    backgroundColor: color.successLight,
    borderRadius: 4,
  },
  challengeCardProgressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    textAlign: "center",
  },
  
  // Progress bar preview
  progressBarPreview: {
    width: "100%",
    maxWidth: 320,
  },
  progressBarTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
    textAlign: "center",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 16,
    backgroundColor: palette.white + "33", // 20% opacity
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: color.successLight,
    borderRadius: 8,
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
  },
  progressBarCurrent: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.successLight,
  },
  progressBarGoal: {
    fontSize: 16,
    color: palette.white + "B3", // 70% opacity
  },
  progressBarMilestones: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBarMilestone: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBarMilestoneCompleted: {
    backgroundColor: palette.green400 + "4D", // 30% opacity
  },
  progressBarMilestoneText: {
    fontSize: 10,
    color: color.textWhite,
  },
  
  // Countdown preview
  countdownPreview: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  countdownTitle: {
    fontSize: 14,
    color: palette.white + "B3", // 70% opacity
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
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: color.textWhite,
  },
  countdownLabel: {
    fontSize: 10,
    color: palette.white + "B3", // 70% opacity
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.white + "80", // 50% opacity
  },
  countdownDate: {
    fontSize: 12,
    color: palette.white + "B3", // 70% opacity
  },
  
  // Achievement preview
  achievementPreview: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  achievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.rankGold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementEmoji: {
    fontSize: 40,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
    color: palette.white + "B3", // 70% opacity
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
    backgroundColor: palette.white + "1A", // 10% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  achievementMore: {
    fontSize: 12,
    color: palette.white + "80", // 50% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  // Share preview
  sharePreview: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
  },
  shareButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  shareCard: {
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 8,
    padding: 12,
    width: "100%",
  },
  shareCardText: {
    fontSize: 12,
    color: color.textWhite,
    textAlign: "center",
  },
  
  // Ranking preview
  rankingPreview: {
    width: "100%",
    maxWidth: 320,
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
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  rankingItemHighlight: {
    backgroundColor: palette.pink500 + "4D", // 30% opacity
    borderWidth: 1,
    borderColor: color.accentPrimary,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.textWhite,
    width: 24,
    textAlign: "center",
  },
  rankingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rankingAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  rankingName: {
    flex: 1,
    fontSize: 14,
    color: color.textWhite,
  },
  rankingScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.successLight,
  },
  
  // DM preview
  dmPreview: {
    width: "100%",
    maxWidth: 320,
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
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  dmMessageSent: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 12,
    maxWidth: "80%",
    alignSelf: "flex-end",
  },
  dmMessageText: {
    fontSize: 14,
    color: color.textWhite,
  },
  
  // Reminder preview
  reminderPreview: {
    width: "100%",
    maxWidth: 320,
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
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 8,
    padding: 12,
  },
  reminderOptionText: {
    fontSize: 14,
    color: color.textWhite,
  },
  reminderToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.white + "33", // 20% opacity
    padding: 2,
  },
  reminderToggleOn: {
    backgroundColor: color.successLight,
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
    maxWidth: 320,
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
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 8,
    padding: 12,
  },
  ticketType: {
    fontSize: 14,
    color: color.textWhite,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.successLight,
  },
  ticketButton: {
    backgroundColor: color.accentPrimary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  ticketButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
  },
  
  // Cheer preview
  cheerPreview: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  cheerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textWhite,
    marginBottom: 12,
  },
  cheerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cheerButton: {
    alignItems: "center",
    backgroundColor: palette.white + "1A", // 10% opacity
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
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
    maxWidth: 320,
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
    backgroundColor: palette.white + "1A", // 10% opacity
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
    color: palette.white + "B3", // 70% opacity
    marginTop: 4,
  },
  
  // Celebration preview
  celebrationPreview: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.rankGold,
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 14,
    color: color.textWhite,
    marginBottom: 16,
  },
  celebrationConfetti: {
    flexDirection: "row",
    gap: 16,
  },
  confettiItem: {
    fontSize: 32,
  },
  
  // Navigation
  navigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 24,
    gap: 40,
  },
  
  // キャラクターナビゲーションボタン
  characterNavButton: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  characterNavButtonDisabled: {
    opacity: 0.4,
  },
  navCharacterImage: {
    width: 56,
    height: 56,
  },
  navBubble: {
    backgroundColor: palette.white + "26", // 15% opacity
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
    marginBottom: 8,
  },
  navBubbleLeft: {
    marginLeft: -8,
  },
  navBubbleRight: {
    marginRight: -8,
  },
  navBubbleDisabled: {
    backgroundColor: palette.white + "14", // 8% opacity
  },
  navBubblePrimary: {
    backgroundColor: color.hotPink,
  },
  navBubbleTailLeft: {
    position: "absolute",
    left: -6,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: "transparent",
    borderBottomWidth: 6,
    borderBottomColor: "transparent",
    borderRightWidth: 6,
    borderRightColor: palette.white + "26",
  },
  navBubbleTailRight: {
    position: "absolute",
    right: -6,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: "transparent",
    borderBottomWidth: 6,
    borderBottomColor: "transparent",
    borderLeftWidth: 6,
    borderLeftColor: color.hotPink,
  },
  navBubbleText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  navBubbleTextDisabled: {
    color: palette.white + "66", // 40% opacity
  },
  navBubbleTextPrimary: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
  
  // 旧ナビゲーション（後方互換用）
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: palette.white + "1A", // 10% opacity
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonPrimary: {
    backgroundColor: color.hotPink,
  },
  navButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  navButtonTextDisabled: {
    color: palette.white + "80", // 50% opacity
  },
  navButtonTextPrimary: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
  },
});
