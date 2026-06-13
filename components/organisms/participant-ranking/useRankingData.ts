/**
 * useRankingData - ランキングデータ処理フック
 * 
 * 単一責任: データの集計・変換ロジックのみ
 */

import { useMemo } from "react";
import type { Participant, RankedParticipant } from "./types";

interface UseRankingDataResult {
  rankedParticipants: RankedParticipant[];
  totalContribution: number;
  avgContribution: string;
  hasMoreParticipants: boolean;
  remainingCount: number;
}

export function useRankingData(
  participants: Participant[],
  maxDisplay: number
): UseRankingDataResult {
  const rankedParticipants = useMemo(() => {
    return [...participants]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, maxDisplay)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }));
  }, [participants, maxDisplay]);

  const totalContribution = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.contribution, 0);
  }, [participants]);

  const avgContribution = useMemo(() => {
    return participants.length > 0
      ? (totalContribution / participants.length).toFixed(1)
      : "0";
  }, [totalContribution, participants.length]);

  const hasMoreParticipants = participants.length > maxDisplay;
  const remainingCount = participants.length - maxDisplay;

  return {
    rankedParticipants,
    totalContribution,
    avgContribution,
    hasMoreParticipants,
    remainingCount,
  };
}

export function useTopThreeData(participants: Participant[]) {
  return useMemo(() => {
    return [...participants]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
  }, [participants]);
}
