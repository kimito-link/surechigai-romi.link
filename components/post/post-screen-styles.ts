/**
 * post-authenticated-screen.tsx から切り出したスタイル定義。
 * post-screen-view.tsx から参照される。
 */
import { StyleSheet, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";

export const styles = StyleSheet.create({
  // 地図マーカーの上限を超えた分を示す集約チップ（sisterBanner と衝突しない上寄せ）。
  radarOverflowChip: {
    position: "absolute",
    top: 12,
    right: 12,
    maxWidth: "70%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(13,17,23,0.72)",
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "55",
    gap: 2,
    zIndex: 20,
  },
  radarOverflowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: color.bg,
  },
  // デスクトップ2カラム(docs/investigation/dashboard-redesign-2026-07-14.md Step6):
  // 地図を隠さないため、右ペインのoverlayをやめてflexDirection:"row"で分割する。
  desktopSplit: {
    flex: 1,
    flexDirection: "row",
  },
  desktopMapColumn: {
    flex: 1,
    position: "relative",
    backgroundColor: color.bg,
  },
  desktopRightPane: {
    width: 360,
    borderLeftWidth: 1,
    borderLeftColor: color.border,
    backgroundColor: color.bg,
  },
  signalPanelDocked: {
    marginTop: 12,
    marginHorizontal: 10,
  },
  mobileScroll: {
    flex: 1,
    backgroundColor: color.bg,
  },
  mobileScrollContent: {
    flexGrow: 1,
  },
  mapHeroMobile: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.bg,
  },
  mobileFooter: {
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  sisterBannerFlow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  emptyOverlayMobile: {
    top: "38%",
  },
  emptyOverlay: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 6,
  },
  emptyOverlayEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyOverlayTitle: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyOverlayText: {
    color: color.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  checkinLink: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  checkinLinkText: {
    color: color.accentPrimary,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  checkinCtaDock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  dividerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.black + "CC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  // Report modal
  reportCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 20,
  },
  reportTitle: {
    color: color.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  reportItemText: {
    color: color.textPrimary,
    fontSize: 14,
  },
  reportCancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  reportCancelText: {
    color: color.textMuted,
    fontSize: 14,
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
  loginGateSubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
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
  // Empty state
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: color.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  checkinButton: {
    backgroundColor: color.accentIndigo,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  checkinButtonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  // 姉妹サービス導線（地図下部に固定・サイバー風）
  sisterBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.kimitoBlueSoft,
    borderWidth: 1,
    borderColor: palette.kimitoBlue + "33",
  },
  sisterBannerLabel: {
    color: color.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  sisterBannerName: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
});
