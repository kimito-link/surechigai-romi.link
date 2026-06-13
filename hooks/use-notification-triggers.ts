import { useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  notifyChallengeGoalReached,
  notifyMilestoneReached,
  notifyNewParticipant,
} from "@/lib/push-notifications";

const MILESTONE_STORAGE_KEY = "milestone_notifications_sent";

// マイルストーンのパーセンテージ
const MILESTONES = [25, 50, 75, 100];

interface Challenge {
  id: number;
  title: string;
  goalValue: number;
  goalUnit?: string;
  currentValue: number;
}

interface MilestoneState {
  [challengeId: string]: number[]; // 送信済みマイルストーンのリスト
}

/**
 * 通知トリガーフック
 * チャレンジの進捗を監視し、マイルストーン達成時に通知を送信
 */
export function useNotificationTriggers(challenge: Challenge | null | undefined) {
  const previousValueRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // 送信済みマイルストーンを取得
  const getSentMilestones = useCallback(async (challengeId: number): Promise<number[]> => {
    try {
      const stored = await AsyncStorage.getItem(MILESTONE_STORAGE_KEY);
      if (stored) {
        const state: MilestoneState = JSON.parse(stored);
        return state[challengeId.toString()] || [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // 送信済みマイルストーンを保存
  const saveSentMilestone = useCallback(async (challengeId: number, milestone: number) => {
    try {
      const stored = await AsyncStorage.getItem(MILESTONE_STORAGE_KEY);
      const state: MilestoneState = stored ? JSON.parse(stored) : {};
      const key = challengeId.toString();
      
      if (!state[key]) {
        state[key] = [];
      }
      
      if (!state[key].includes(milestone)) {
        state[key].push(milestone);
        await AsyncStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.error("[NotificationTriggers] Failed to save milestone:", error);
    }
  }, []);

  // マイルストーン達成をチェック
  const checkMilestones = useCallback(async (
    challengeId: number,
    title: string,
    currentValue: number,
    goalValue: number,
    goalUnit: string
  ) => {
    if (goalValue <= 0) return;

    const percentage = (currentValue / goalValue) * 100;
    const sentMilestones = await getSentMilestones(challengeId);

    for (const milestone of MILESTONES) {
      // このマイルストーンに達成していて、まだ通知していない場合
      if (percentage >= milestone && !sentMilestones.includes(milestone)) {
        if (milestone === 100) {
          // 目標達成通知
          await notifyChallengeGoalReached(title, goalValue, goalUnit);
        } else {
          // マイルストーン通知
          await notifyMilestoneReached(title, milestone, currentValue, goalUnit);
        }
        
        await saveSentMilestone(challengeId, milestone);
        console.log(`[NotificationTriggers] Milestone ${milestone}% reached for challenge ${challengeId}`);
      }
    }
  }, [getSentMilestones, saveSentMilestone]);

  // チャレンジの進捗を監視
  useEffect(() => {
    if (!challenge) return;

    const { id, title, currentValue, goalValue, goalUnit = "人" } = challenge;

    // 初回は通知を送らない（既存の状態を記録するだけ）
    if (!isInitializedRef.current) {
      previousValueRef.current = currentValue;
      isInitializedRef.current = true;
      return;
    }

    // 値が変化した場合のみチェック
    if (previousValueRef.current !== currentValue) {
      previousValueRef.current = currentValue;
      checkMilestones(id, title, currentValue, goalValue, goalUnit);
    }
  }, [challenge, checkMilestones]);

  return {
    notifyNewParticipant: useCallback(
      (participantName: string) => {
        if (challenge) {
          notifyNewParticipant(challenge.title, participantName);
        }
      },
      [challenge]
    ),
  };
}

/**
 * 新規参加者通知を送信（主催者向け）
 */
export async function triggerNewParticipantNotification(
  challengeTitle: string,
  participantName: string
): Promise<void> {
  await notifyNewParticipant(challengeTitle, participantName);
}

/**
 * マイルストーン通知の履歴をクリア（デバッグ用）
 */
export async function clearMilestoneHistory(): Promise<void> {
  await AsyncStorage.removeItem(MILESTONE_STORAGE_KEY);
  console.log("[NotificationTriggers] Milestone history cleared");
}
