/**
 * use-demo-challenge Hook
 * デモチャレンジの状態・アクション管理
 */

import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import {
  getDemoChallenge,
  joinDemoChallenge,
  addDemoContribution,
  resetDemoState,
  type DemoChallenge,
  type DemoState,
} from "@/lib/demo-challenge";

export type DemoChallengeData = DemoChallenge & { userState: DemoState };

interface UseDemoChallengeReturn {
  challenge: DemoChallengeData | null;
  loading: boolean;
  joining: boolean;
  showConfetti: boolean;
  error: string | null;
  loadChallenge: () => Promise<void>;
  handleJoin: () => Promise<void>;
  handleAddContribution: () => Promise<void>;
  handleReset: () => Promise<void>;
}

export function useDemoChallenge(
  onJoinSuccess?: () => void
): UseDemoChallengeReturn {
  const [challenge, setChallenge] = useState<DemoChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    setError(null);
    try {
      const data = await getDemoChallenge();
      setChallenge(data);
    } catch {
      setError("デモデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleJoin = async () => {
    if (!challenge || challenge.userState.hasJoined || joining) return;

    setJoining(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await joinDemoChallenge();

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      onJoinSuccess?.();
      await loadChallenge();
    } catch {
      Alert.alert("エラー", "参加処理に失敗しました。もう一度お試しください。");
    } finally {
      setJoining(false);
    }
  };

  const handleAddContribution = async () => {
    if (!challenge || !challenge.userState.hasJoined) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await addDemoContribution(1);
      await loadChallenge();
    } catch {
      Alert.alert("エラー", "友達の追加に失敗しました。もう一度お試しください。");
    }
  };

  const handleReset = async () => {
    await resetDemoState();
    await loadChallenge();
  };

  return {
    challenge,
    loading,
    joining,
    showConfetti,
    error,
    loadChallenge,
    handleJoin,
    handleAddContribution,
    handleReset,
  };
}
