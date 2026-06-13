/**
 * ParticipantsOverview Component
 * 参加者一覧、ランキング、地域マップの概要表示
 */

import { View, Text } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { SectionHeader } from "@/components/ui";
import { typography } from "@/theme/tokens";
import { TicketTransferSection } from "@/components/organisms/ticket-transfer-section";
import { TopThreeRanking } from "@/components/organisms/participant-ranking";
import {
  RegionMap,
  ParticipantsList,
  ContributionRanking,
} from "@/features/events/components";
import { JapanMapDeformed } from "@/components/molecules/japan-map-deformed";
import type { Participation } from "@/types/participation";
import type { FanProfile } from "../types";

interface ParticipantsOverviewProps {
  challengeId: number;
  challengeTitle: string;
  participations: Participation[] | undefined;
  followerIds: number[] | undefined;
  onFanPress: (fan: FanProfile) => void;
  /** 点灯させる都道府県（参加完了時） */
  highlightPrefecture?: string | null;
  /** 都道府県がタップされたときのコールバック */
  onPrefecturePress?: (prefecture: string) => void;
  /** 参加方法別集計 */
  attendanceTypeCounts?: {
    venue: number;
    streaming: number;
    both: number;
    total: number;
  };
}

export function ParticipantsOverview({
  challengeId,
  challengeTitle,
  participations,
  followerIds,
  onFanPress,
  highlightPrefecture,
  onPrefecturePress,
  attendanceTypeCounts,
}: ParticipantsOverviewProps) {
  const colors = useColors();
  
  if (!participations || participations.length === 0) {
    return (
      <TicketTransferSection
        challengeId={challengeId}
        challengeTitle={challengeTitle}
      />
    );
  }
  
  return (
    <>
      {/* チケット譲渡セクション */}
      <TicketTransferSection
        challengeId={challengeId}
        challengeTitle={challengeTitle}
      />

      {/* 参加方法別カウンター */}
      {attendanceTypeCounts && (
        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <View style={{ backgroundColor: color.surface, borderRadius: 16, padding: 16 }}>
            <SectionHeader title="参加方法別内訳" style={{ paddingHorizontal: 0, paddingVertical: 0, marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, backgroundColor: color.bg, borderRadius: 12, padding: 12 }}>
                <Text style={{ color: colors.muted, fontSize: typography.fontSize.xs, marginBottom: 4 }}>🏟️ 会場参加</Text>
                <Text style={{ color: colors.foreground, fontSize: typography.fontSize["2xl"], fontWeight: "bold" }}>
                  {attendanceTypeCounts.venue + attendanceTypeCounts.both}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: color.bg, borderRadius: 12, padding: 12 }}>
                <Text style={{ color: colors.muted, fontSize: typography.fontSize.xs, marginBottom: 4 }}>📺 配信視聴</Text>
                <Text style={{ color: colors.foreground, fontSize: typography.fontSize["2xl"], fontWeight: "bold" }}>
                  {attendanceTypeCounts.streaming + attendanceTypeCounts.both}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* デフォルメ日本地図 */}
      <JapanMapDeformed
        prefectureCounts={participations.reduce((acc, p) => {
          if (p.prefecture) {
            acc[p.prefecture] = (acc[p.prefecture] || 0) + (p.contribution || 1);
          }
          return acc;
        }, {} as Record<string, number>)}
        highlightPrefecture={highlightPrefecture}
        onPrefecturePress={onPrefecturePress}
      />

      {/* 地域別マップ */}
      <RegionMap participations={participations} />

      {/* 一緒に参加している人 */}
      <ParticipantsList 
        participations={participations} 
        onFanPress={(fan) => onFanPress({
          twitterId: fan.twitterId,
          username: fan.username,
          displayName: fan.displayName,
          profileImage: fan.profileImage,
        })}
      />

      {/* 貢献度ランキング */}
      <ContributionRanking 
        participations={participations} 
        followerIds={followerIds || []} 
      />

      {/* 参加者ランキング（トップ3） */}
      {participations.length >= 3 && (
        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <View style={{ backgroundColor: color.surface, borderRadius: 16, padding: 16 }}>
            <SectionHeader title="貢献トップ3" icon="emoji-events" iconColor={color.rankGold} style={{ paddingHorizontal: 0, paddingVertical: 0, marginBottom: 8 }} />
            <TopThreeRanking participants={participations} />
          </View>
        </View>
      )}
    </>
  );
}
