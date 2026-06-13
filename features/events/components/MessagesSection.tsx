import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Button } from "@/components/ui/button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { eventUI } from "@/features/events/ui/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { regionGroups, prefectures } from "@/constants/prefectures";
import { MessageCard } from "./MessageCard";
import type { Participation } from "@/types/participation";
import { eventDetailCopy } from "@/constants/copy";

export type GenderFilter = "all" | "male" | "female";

/** 同伴者の表示用型 */
interface CompanionDisplay {
  id: number;
  participationId: number;
  displayName: string;
  twitterUsername: string | null;
  profileImage: string | null;
  isConfirmed?: boolean;
}

export type MessagesSectionProps = {
  participations: Participation[];
  challengeCompanions?: CompanionDisplay[];
  selectedGenderFilter: GenderFilter;
  onGenderFilterChange: (filter: GenderFilter) => void;
  selectedPrefectureFilter: string;
  onPrefectureFilterChange: (filter: string) => void;
  showPrefectureFilterList: boolean;
  onTogglePrefectureFilterList: () => void;
  justSubmitted?: boolean;
  currentUserId?: number;
  currentUserTwitterId?: string;
  challengeId: number;
  onCheer: (participationId: number, userId: number | null) => void;
  onDM: (userId: number) => void;
  onEdit: (participationId: number) => void;
  onDelete: (participation: Participation) => void;
};

export function MessagesSection({
  participations,
  challengeCompanions = [],
  selectedGenderFilter,
  onGenderFilterChange,
  selectedPrefectureFilter,
  onPrefectureFilterChange,
  showPrefectureFilterList,
  onTogglePrefectureFilterList,
  justSubmitted = false,
  currentUserId,
  currentUserTwitterId,
  challengeId,
  onCheer,
  onDM,
  onEdit,
  onDelete,
}: MessagesSectionProps) {
  const colors = useColors();

  // 男女比を計算
  const maleCount = participations.filter(p => p.gender === "male").length;
  const femaleCount = participations.filter(p => p.gender === "female").length;
  const unspecifiedCount = participations.filter(p => !p.gender || p.gender === "unspecified").length;
  const total = participations.length;
  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;
  const unspecifiedPercent = total > 0 ? Math.round((unspecifiedCount / total) * 100) : 0;

  // フィルター適用
  const filteredParticipations = participations.filter(p => {
    // 性別フィルター
    if (selectedGenderFilter !== "all") {
      if (selectedGenderFilter === "male" && p.gender !== "male") return false;
      if (selectedGenderFilter === "female" && p.gender !== "female") return false;
    }
    // 地域フィルター
    if (selectedPrefectureFilter === "all") return true;
    // 地域グループでフィルター
    const region = regionGroups.find(r => r.name === selectedPrefectureFilter);
    if (region) return (region.prefectures as readonly string[]).includes(p.prefecture || "");
    // 都道府県でフィルター
    return p.prefecture === selectedPrefectureFilter;
  });

  const isOwnPost = (p: Participation) => {
    return Boolean(
      (currentUserId && p.userId === currentUserId) ||
      (currentUserTwitterId && p.twitterId === currentUserTwitterId)
    );
  };

  return (
    <View style={styles.container}>
      {/* 参加表明完了時のハイライト表示 */}
      {justSubmitted && (
        <View style={styles.submitHighlight}>
          <View style={styles.submitHighlightHeader}>
            <View style={styles.submitHighlightIcon}>
              <MaterialIcons name="check-circle" size={32} color={colors.foreground} />
            </View>
            <View style={styles.submitHighlightText}>
              <Text style={[styles.submitHighlightTitle, { color: colors.foreground }]}>
                🎉 {eventDetailCopy.success.participated}
              </Text>
              <Text style={styles.submitHighlightSubtitle}>
                {eventDetailCopy.success.participatedMessage}
              </Text>
            </View>
          </View>
          <View style={styles.submitHighlightHint}>
            <Text style={[styles.submitHighlightHintText, { color: colors.foreground }]}>
              ⬇️ 下にスクロールしてあなたの投稿を確認してね！
            </Text>
          </View>
        </View>
      )}

      {/* 男女比表示 */}
      <View style={styles.genderRatioCard}>
        <View style={styles.genderRatioHeader}>
          <MaterialIcons name="people" size={16} color={color.accentPrimary} />
          <Text style={[styles.genderRatioTitle, { color: colors.foreground }]}>
            男女比
          </Text>
        </View>
        
        {/* バー表示 */}
        <View style={[styles.genderRatioBar, { backgroundColor: colors.background }]}>
          {maleCount > 0 && (
            <View style={[styles.genderBarSegment, { width: `${malePercent}%`, backgroundColor: color.info }]}>
              {malePercent >= 15 && (
                <Text style={[styles.genderBarText, { color: colors.foreground }]}>
                  {malePercent}%
                </Text>
              )}
            </View>
          )}
          {femaleCount > 0 && (
            <View style={[styles.genderBarSegment, { width: `${femalePercent}%`, backgroundColor: color.accentPrimary }]}>
              {femalePercent >= 15 && (
                <Text style={[styles.genderBarText, { color: colors.foreground }]}>
                  {femalePercent}%
                </Text>
              )}
            </View>
          )}
          {unspecifiedCount > 0 && (
            <View style={[styles.genderBarSegment, { width: `${unspecifiedPercent}%`, backgroundColor: color.textHint }]}>
              {unspecifiedPercent >= 15 && (
                <Text style={[styles.genderBarText, { color: colors.foreground }]}>
                  {unspecifiedPercent}%
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* 凡例 */}
        <View style={styles.genderLegend}>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendDot, { backgroundColor: color.info }]} />
            <Text style={styles.genderLegendText}>男性 {maleCount}人</Text>
          </View>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendDot, { backgroundColor: color.accentPrimary }]} />
            <Text style={styles.genderLegendText}>女性 {femaleCount}人</Text>
          </View>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendDot, { backgroundColor: color.textHint }]} />
            <Text style={styles.genderLegendText}>未設定 {unspecifiedCount}人</Text>
          </View>
        </View>
      </View>

      {/* ヘッダーとフィルター */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          応援メッセージ ({participations.length}件)
        </Text>
        
        <View style={styles.filters}>
          {/* 性別フィルター */}
          <View style={styles.genderFilterContainer}>
            <Button
              variant={selectedGenderFilter === "all" ? "primary" : "secondary"}
              size="sm"
              onPress={() => onGenderFilterChange("all")}
              style={[
                styles.genderFilterButton,
                selectedGenderFilter === "all" && styles.genderFilterButtonActive,
              ]}
            >
              <Text style={[
                styles.genderFilterText,
                { color: selectedGenderFilter === "all" ? color.textWhite : color.textSecondary }
              ]}>全て</Text>
            </Button>
            <Button
              variant={selectedGenderFilter === "male" ? "primary" : "secondary"}
              size="sm"
              onPress={() => onGenderFilterChange("male")}
              style={[
                styles.genderFilterButton,
                selectedGenderFilter === "male" && { backgroundColor: color.info },
              ]}
            >
              <Text style={[
                styles.genderFilterText,
                { color: selectedGenderFilter === "male" ? color.textWhite : color.textSecondary }
              ]}>男性</Text>
            </Button>
            <Button
              variant={selectedGenderFilter === "female" ? "primary" : "secondary"}
              size="sm"
              onPress={() => onGenderFilterChange("female")}
              style={[
                styles.genderFilterButton,
                selectedGenderFilter === "female" && { backgroundColor: eventUI.badge },
              ]}
            >
              <Text style={[
                styles.genderFilterText,
                { color: selectedGenderFilter === "female" ? color.textWhite : color.textSecondary }
              ]}>女性</Text>
            </Button>
          </View>

          {/* 地域フィルター */}
          <Button
            variant="secondary"
            size="sm"
            onPress={onTogglePrefectureFilterList}
            style={[
              styles.prefectureFilterButton,
              selectedPrefectureFilter !== "all" && styles.prefectureFilterButtonActive,
            ]}
          >
            <MaterialIcons
              name="filter-list"
              size={16}
              color={selectedPrefectureFilter !== "all" ? color.accentPrimary : color.textSecondary}
            />
            <Text style={[
              styles.prefectureFilterText,
              { color: selectedPrefectureFilter !== "all" ? color.accentPrimary : color.textSecondary }
            ]}>
              {selectedPrefectureFilter === "all" ? "地域" : selectedPrefectureFilter}
            </Text>
          </Button>
        </View>
      </View>

      {/* 地域フィルターリスト */}
      {showPrefectureFilterList && (
        <View style={styles.prefectureFilterList}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
            <Button
              variant={selectedPrefectureFilter === "all" ? "primary" : "secondary"}
              size="sm"
              onPress={() => { onPrefectureFilterChange("all"); onTogglePrefectureFilterList(); }}
              style={[
                styles.regionChip,
                selectedPrefectureFilter === "all" && styles.regionChipActive,
              ]}
            >
              <Text style={[styles.regionChipText, { color: colors.foreground }]}>すべて</Text>
            </Button>
            {regionGroups.map((region) => (
              <Button
                key={region.name}
                variant={selectedPrefectureFilter === region.name ? "primary" : "secondary"}
                size="sm"
                onPress={() => { onPrefectureFilterChange(region.name); onTogglePrefectureFilterList(); }}
                style={[
                  styles.regionChip,
                  selectedPrefectureFilter === region.name && styles.regionChipActive,
                ]}
              >
                <Text style={[styles.regionChipText, { color: colors.foreground }]}>{region.name}</Text>
              </Button>
            ))}
          </ScrollView>
          <View style={styles.prefectureGrid}>
            {prefectures.map((pref) => (
              <Button
                key={pref}
                variant={selectedPrefectureFilter === pref ? "primary" : "secondary"}
                size="sm"
                onPress={() => { onPrefectureFilterChange(pref); onTogglePrefectureFilterList(); }}
                style={[
                  styles.prefectureChip,
                  selectedPrefectureFilter === pref && styles.prefectureChipActive,
                ]}
              >
                <Text style={[
                  styles.prefectureChipText,
                  { color: selectedPrefectureFilter === pref ? color.textWhite : color.textSecondary }
                ]}>{pref}</Text>
              </Button>
            ))}
          </View>
        </View>
      )}

      {/* メッセージ一覧 */}
      {filteredParticipations.map((p) => {
        const participantCompanions = challengeCompanions.filter(c => c.participationId === p.id);
        const isOwn = isOwnPost(p);
        
        return (
          <View key={p.id} style={isOwn && justSubmitted ? styles.ownPostHighlight : undefined}>
            {isOwn && justSubmitted && (
              <View style={styles.ownPostBadge}>
                <MaterialIcons name="star" size={18} color={colors.foreground} />
                <Text style={[styles.ownPostBadgeText, { color: colors.foreground }]}>
                  ✨ あなたの参加表明が反映されました！
                </Text>
              </View>
            )}
            <MessageCard
              participation={p}
              onCheer={() => onCheer(p.id, p.userId)}
              onDM={(userId) => onDM(userId)}
              challengeId={challengeId}
              companions={participantCompanions}
              isOwnPost={isOwn}
              onEdit={() => onEdit(p.id)}
              onDelete={() => onDelete(p)}
            />
          </View>
        );
      })}

      {/* フィルター結果が0件の場合 */}
      {filteredParticipations.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={48} color={color.textHint} />
          <Text style={styles.emptyStateText}>
            該当する参加者がいません
          </Text>
          <Text style={styles.emptyStateSubtext}>
            フィルターを変更してみてください
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  submitHighlight: {
    backgroundColor: color.successDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: color.emerald400,
    shadowColor: color.successDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitHighlightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  submitHighlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.textWhite + "33", // rgba(255,255,255,0.2) の透明度16進数
    justifyContent: "center",
    alignItems: "center",
  },
  submitHighlightText: {
    marginLeft: 16,
    flex: 1,
  },
  submitHighlightTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  submitHighlightSubtitle: {
    color: color.textWhite + "E6", // rgba(255,255,255,0.9) の透明度16進数
    fontSize: 14,
    marginTop: 4,
  },
  submitHighlightHint: {
    backgroundColor: color.textWhite + "26", // rgba(255,255,255,0.15) の透明度16進数
    borderRadius: 12,
    padding: 12,
  },
  submitHighlightHintText: {
    fontSize: 14,
    textAlign: "center",
  },
  genderRatioCard: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
  },
  genderRatioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  genderRatioTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  genderRatioBar: {
    flexDirection: "row",
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  genderBarSegment: {
    justifyContent: "center",
    alignItems: "center",
  },
  genderBarText: {
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
  },
  genderLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  genderLegendText: {
    color: color.textSecondary,
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  genderFilterContainer: {
    flexDirection: "row",
    backgroundColor: color.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  genderFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  genderFilterButtonActive: {
    backgroundColor: color.accentPrimary,
  },
  genderFilterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  prefectureFilterButton: {
    backgroundColor: color.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
  },
  prefectureFilterButtonActive: {
    borderColor: color.accentPrimary,
  },
  prefectureFilterText: {
    fontSize: 12,
    marginLeft: 4,
  },
  prefectureFilterList: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  regionScroll: {
    marginBottom: 8,
  },
  regionChip: {
    backgroundColor: color.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  regionChipActive: {
    backgroundColor: color.accentPrimary,
  },
  regionChipText: {
    fontSize: 12,
  },
  prefectureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prefectureChip: {
    backgroundColor: color.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prefectureChipActive: {
    backgroundColor: color.accentPrimary,
  },
  prefectureChipText: {
    fontSize: 12,
  },
  ownPostHighlight: {
    borderWidth: 3,
    borderColor: color.successDark,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: color.successDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ownPostBadge: {
    backgroundColor: color.successDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  ownPostBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: color.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: color.textHint,
    fontSize: 14,
    marginTop: 4,
  },
});
