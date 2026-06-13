import { StyleSheet } from "react-native";
import { color, palette } from "@/theme/tokens";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: color.textSecondary,
  },
  totalMessage: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  totalMessageText: {
    fontSize: 16,
    color: color.textSecondary,
  },
  totalMessageCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: color.accentPrimary,
  },
  totalMessageSub: {
    fontSize: 12,
    color: color.textMuted,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  regionBlock: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    shadowColor: color.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userRegionBlock: {
    shadowColor: color.accentPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  userRegionBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: color.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userRegionBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: color.textWhite,
  },
  hotBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: color.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: color.textWhite,
  },
  regionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  regionName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
  },
  regionCount: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  fireIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: color.textSubtle,
  },
  legendContainer: {
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  legendTitle: {
    fontSize: 12,
    color: color.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  legendBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  legendSegment: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: color.textMuted,
  },
  rankingContainer: {
    backgroundColor: color.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rankingTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textPrimary,
    marginBottom: 12,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.surfaceAlt,
  },
  rankingItemHighlight: {
    backgroundColor: palette.pink500 + "1A", // 10% opacity
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  rankingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankingRank: {
    fontSize: 16,
    width: 28,
    textAlign: "center",
  },
  rankingEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  rankingName: {
    fontSize: 14,
    color: color.textPrimary,
  },
  rankingNameHighlight: {
    fontWeight: "bold",
    color: color.accentPrimary,
  },
  rankingRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  rankingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: color.surfaceAlt,
    borderRadius: 4,
    marginRight: 8,
    overflow: "hidden",
  },
  rankingBar: {
    height: "100%",
    borderRadius: 4,
  },
  rankingCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textPrimary,
    width: 50,
    textAlign: "right",
  },
  hotHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.red400 + "26", // 15% opacity
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.red400 + "4D", // 30% opacity
  },
  hotIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  hotTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: color.coral,
  },
  hotSubtitle: {
    fontSize: 12,
    color: color.textSecondary,
  },
  // モーダルスタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "99", // 60% opacity
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: color.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: color.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: color.textSecondary,
  },
  modalSubtitle: {
    fontSize: 16,
    color: color.textSecondary,
    marginBottom: 16,
  },
  prefectureList: {
    maxHeight: 300,
  },
  prefectureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: color.border,
  },
  prefectureName: {
    fontSize: 16,
    fontWeight: "600",
  },
  prefectureCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prefectureFire: {
    fontSize: 14,
  },
  prefectureWaiting: {
    fontSize: 14,
  },
  prefectureCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAllButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  viewAllButtonText: {
    color: color.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
  // 都道府県ランキングスタイル
  prefectureRankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.surfaceAlt,
  },
  prefectureRankItemHighlight: {
    backgroundColor: palette.pink500 + "26", // 15% opacity
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 12,
  },
  prefectureRankLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prefectureRankEmoji: {
    fontSize: 16,
    width: 28,
    textAlign: "center",
  },
  prefectureRankName: {
    fontSize: 15,
    fontWeight: "600",
    color: color.textPrimary,
    marginLeft: 4,
  },
  prefectureRankNameHighlight: {
    color: color.accentPrimary,
  },
  prefectureUserBadge: {
    backgroundColor: color.accentPrimary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  prefectureUserBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: color.textWhite,
  },
  prefectureRankRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1.5,
  },
  prefectureBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: color.surfaceAlt,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8,
  },
  prefectureBar: {
    height: "100%",
    borderRadius: 4,
  },
  prefectureRankCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: color.textPrimary,
    width: 40,
    textAlign: "right",
  },
});
