/**
 * features/events/hooks/event-detail-screen/useEventData.ts
 * 
 * イベントデータの取得・変換ロジック
 */
import { useMemo } from "react";
import { toEventDetailVM, type EventDetailVM } from "../../mappers/eventDetailVM";
import { 
  toParticipationVMList, 
  toCompanionVMList,
  type ParticipationVM, 
  type CompanionVM,
} from "../../mappers/participationVM";
import { regionGroups, normalizePrefecture } from "../../utils/prefectures";
import type { ProgressItemVM } from "../../components/ProgressGrid";
import type { RegionGroupVM } from "../../components/RegionMap";
import type { RankingItemVM } from "../../components/ContributionRanking";
import type { MessageVM } from "../../components/MessageCard";

type User = {
  id: number;
  openId: string;
  name?: string | null;
  username?: string | null;
} | null;

/**
 * イベントデータの変換フック
 */
export function useEventData(
  challengeData: any,
  participationsData: any,
  challengeCompanions: any,
  followerIdsData: number[] | undefined,
  user: User
) {
  // VM変換
  const vm = useMemo((): EventDetailVM | undefined => {
    if (!challengeData) return undefined;
    return toEventDetailVM(challengeData as any);
  }, [challengeData]);
  
  const participations = useMemo((): ParticipationVM[] => {
    if (!participationsData) return [];
    return toParticipationVMList(participationsData as any);
  }, [participationsData]);
  
  const companionsVM = useMemo((): CompanionVM[] => {
    if (!challengeCompanions) return [];
    return toCompanionVMList(challengeCompanions as any);
  }, [challengeCompanions]);
  
  // 自分の参加表明
  const myParticipation = useMemo((): ParticipationVM | null => {
    if (!user || !participations.length) return null;
    const twitterId = user.openId?.startsWith("twitter:") 
      ? user.openId.replace("twitter:", "") 
      : user.openId;
    return participations.find(p => p.twitterId === twitterId) || null;
  }, [user, participations]);
  
  // 勢い計算
  const momentum = useMemo(() => {
    if (!participations.length) return { recent24h: 0, recent1h: 0, isHot: false };
    const now = new Date();
    const recent24h = participations.filter(p => {
      return (now.getTime() - p.createdAt.getTime()) < 24 * 60 * 60 * 1000;
    }).length;
    const recent1h = participations.filter(p => {
      return (now.getTime() - p.createdAt.getTime()) < 60 * 60 * 1000;
    }).length;
    return {
      recent24h,
      recent1h,
      isHot: recent24h >= 5 || recent1h >= 2,
    };
  }, [participations]);
  
  // 進捗グリッド
  const progressItems = useMemo((): ProgressItemVM[] => {
    const participantCount = participations.length;
    const goalTarget = vm?.goalTarget ?? 0;
    const progressPercent = goalTarget > 0 
      ? Math.min(100, Math.round((participantCount / goalTarget) * 100)) 
      : 0;
    
    // 都道府県数
    const prefectureSet = new Set(
      participations
        .map(p => p.prefectureNormalized)
        .filter(Boolean)
    );
    
    // 総貢献度（参加者 + 同行者）
    const totalContribution = participations.reduce(
      (sum, p) => sum + 1 + (p.companionCount || 0), 
      0
    );
    
    return [
      {
        key: "participants",
        label: "参加者",
        valueText: `${participantCount}人`,
        subText: goalTarget > 0 ? `目標: ${goalTarget}人` : undefined,
      },
      {
        key: "progress",
        label: "達成率",
        valueText: `${progressPercent}%`,
        subText: goalTarget > 0 && participantCount < goalTarget 
          ? `あと${goalTarget - participantCount}人` 
          : undefined,
      },
      {
        key: "prefectures",
        label: "都道府県",
        valueText: `${prefectureSet.size}`,
        subText: "地域から参加",
      },
      {
        key: "contribution",
        label: "総動員",
        valueText: `${totalContribution}人`,
        subText: "参加者+同行者",
      },
    ];
  }, [participations, vm]);
  
  // 地域グループ（参加者数付き）
  const regions = useMemo((): RegionGroupVM[] => {
    const countsByPref = new Map<string, number>();
    for (const p of participations) {
      const key = p.prefectureNormalized;
      if (!key) continue;
      countsByPref.set(key, (countsByPref.get(key) ?? 0) + 1);
    }
    
    return regionGroups.map((r) => {
      const count = r.prefectures.reduce((sum, pref) => {
        const key = normalizePrefecture(pref);
        return sum + (countsByPref.get(key) ?? 0);
      }, 0);
      
      return {
        id: r.id,
        name: r.name,
        prefectures: r.prefectures,
        count,
        countText: count > 0 ? `${count}人` : undefined,
      };
    });
  }, [participations]);
  
  // 貢献ランキング
  const ranking = useMemo((): RankingItemVM[] => {
    const rows = [...participations]
      .map((p) => {
        // 貢献度 = 1（自分） + 同行者数
        const value = 1 + (p.companionCount || 0);
        return { p, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    return rows.map(({ p, value }, idx) => ({
      key: p.id,
      rank: idx + 1,
      twitterId: p.twitterId,
      displayName: p.displayName,
      username: p.username ?? undefined,
      profileImage: p.profileImage ?? undefined,
      valueText: `${value}人`,
    }));
  }, [participations]);
  
  // メッセージ一覧
  const messages = useMemo((): MessageVM[] => {
    return participations
      .filter((p) => !!p.message)
      .map((p) => ({
        id: `p-${p.id}`,
        twitterId: p.twitterId,
        displayName: p.displayName,
        username: p.username ?? undefined,
        profileImage: p.profileImage ?? undefined,
        message: p.message ?? "",
        createdAtText: p.createdAtText ?? undefined,
      }));
  }, [participations]);
  
  // フォロワーIDセット
  const followerIdSet = useMemo(() => {
    return new Set((followerIdsData ?? []).map(String));
  }, [followerIdsData]);

  return {
    vm,
    participations,
    companionsVM,
    myParticipation,
    momentum,
    progressItems,
    regions,
    ranking,
    messages,
    followerIdSet,
  };
}
