/**
 * useMypageData Hook
 * マイページのデータ取得
 */

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

interface UseMypageDataReturn {
  // Auth
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  
  // Data
  myChallenges: any[] | undefined;
  myParticipations: any[] | undefined;
  myBadges: any[] | undefined;
  invitationStats: any | undefined;
  totalContribution: number;
}

export function useMypageData(): UseMypageDataReturn {
  const { user, isAuthReadyForUI, login, logout, isAuthenticated } = useAuth();
  // Clerkが遅い場合5秒でフォールバック（スケルトン継続を防ぐ）
  const loadingForUI = !isAuthReadyForUI;
  
  const { data: myChallenges } = trpc.events.myEvents.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myParticipations } = trpc.participations.myParticipations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myBadges } = trpc.badges.myBadges.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: invitationStats } = (trpc.invitations as any).myStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 総貢献度を計算
  const totalContribution = useMemo(() => {
    return myParticipations?.reduce((sum, p) => sum + (p.contribution || 1), 0) || 0;
  }, [myParticipations]);

  return {
    // Auth
    user,
    loading: loadingForUI,
    isAuthenticated,
    login,
    logout,
    
    // Data
    myChallenges,
    myParticipations,
    myBadges,
    invitationStats,
    totalContribution,
  };
}
