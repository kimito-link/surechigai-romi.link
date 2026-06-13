/**
 * useEventActions Hook
 * イベント詳細画面のアクション（シェア、削除、エール等）
 */

import { useState } from "react";
import { Alert, Share } from "react-native";
import { trpc } from "@/lib/trpc";
import { shareToTwitter } from "@/lib/share";
import { generateShareMessage, generateShareUrl, DEFAULT_HASHTAGS } from "../constants";
import type { Participation } from "@/types/participation";

interface UseEventActionsOptions {
  challengeId: number;
  challengeTitle: string;
  currentValue: number;
  goalValue: number;
  unit: string;
  progress: number;
  remaining: number;
  refetch: () => Promise<void>;
}

interface UseEventActionsReturn {
  // Share actions
  handleShare: () => Promise<void>;
  handleTwitterShare: () => Promise<void>;
  handleShareWithOgp: () => Promise<void>;
  isGeneratingOgp: boolean;
  
  // Cheer actions
  handleSendCheer: (participationId: number, toUserId: number | null) => void;
  
  // Delete participation
  showDeleteParticipationModal: boolean;
  setShowDeleteParticipationModal: (value: boolean) => void;
  deleteTargetParticipation: Participation | null;
  setDeleteTargetParticipation: (value: Participation | null) => void;
  handleDeleteParticipation: () => void;
  isDeleting: boolean;
}

/**
 * エラーメッセージにrequestIdを付与して表示
 */
function showErrorWithRequestId(title: string, error: unknown, fallbackMessage: string) {
  const errorObj = error as { message?: string; data?: { requestId?: string } };
  const message = errorObj?.message || fallbackMessage;
  const requestId = errorObj?.data?.requestId;
  
  if (requestId && __DEV__) {
    // 開発モードではrequestIdを表示
    Alert.alert(title, `${message}\n\n[requestId: ${requestId}]`);
  } else {
    Alert.alert(title, message);
  }
}

export function useEventActions({
  challengeId,
  challengeTitle,
  currentValue,
  goalValue,
  unit,
  progress,
  remaining,
}: UseEventActionsOptions): UseEventActionsReturn {
  // OGP generation state
  const [isGeneratingOgp, setIsGeneratingOgp] = useState(false);
  
  // Delete modal state
  const [showDeleteParticipationModal, setShowDeleteParticipationModal] = useState(false);
  const [deleteTargetParticipation, setDeleteTargetParticipation] = useState<Participation | null>(null);
  
  // tRPC utils for invalidation
  const utils = trpc.useUtils();
  
  // Mutations
  const generateOgpMutation = trpc.ogp.generateChallengeOgp.useMutation();
  
  const sendCheerMutation = trpc.cheers.send.useMutation({
    onSuccess: () => {
      Alert.alert("👏", "エールを送りました！");
      // エール数を更新
      utils.participations.listByEvent.invalidate({ eventId: challengeId });
    },
    onError: (error) => {
      showErrorWithRequestId("エラー", error, "エールの送信に失敗しました");
    },
  });
  
  const deleteParticipationMutation = trpc.participations.delete.useMutation({
    onSuccess: () => {
      Alert.alert("参加取消", "参加表明を取り消しました");
      setShowDeleteParticipationModal(false);
      setDeleteTargetParticipation(null);
      // invalidateで即反映
      utils.participations.listByEvent.invalidate({ eventId: challengeId });
      utils.participations.myParticipations.invalidate();
      utils.events.getById.invalidate({ id: challengeId });
    },
    onError: (error) => {
      showErrorWithRequestId("エラー", error, "削除に失敗しました");
    },
  });
  
  // Share handler
  const handleShare = async () => {
    try {
      const shareMessage = `${generateShareMessage(
        challengeTitle,
        currentValue,
        goalValue,
        unit,
        progress,
        remaining
      )}\n\n#${DEFAULT_HASHTAGS.join(" #")}`;
      await Share.share({ message: shareMessage });
    } catch (error) {
      Alert.alert("エラー", "シェアに失敗しました");
    }
  };
  
  // Twitter share handler
  const handleTwitterShare = async () => {
    const text = generateShareMessage(
      challengeTitle,
      currentValue,
      goalValue,
      unit,
      progress,
      remaining
    );
    const shareUrl = generateShareUrl(challengeId);
    await shareToTwitter(text, shareUrl, [...DEFAULT_HASHTAGS]);
  };
  
  // Share with OGP
  const handleShareWithOgp = async () => {
    try {
      setIsGeneratingOgp(true);
      const result = await generateOgpMutation.mutateAsync({ challengeId });
      
      const shareMessage = `${generateShareMessage(
        challengeTitle,
        currentValue,
        goalValue,
        unit,
        progress,
        remaining
      )}\n${result.url || ""}\n\n#${DEFAULT_HASHTAGS.join(" #")}`;
      
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("OGP share error:", error);
      handleShare();
    } finally {
      setIsGeneratingOgp(false);
    }
  };
  
  // Send cheer
  const handleSendCheer = (participationId: number, toUserId: number | null) => {
    sendCheerMutation.mutate({
      toParticipationId: participationId,
      toUserId: toUserId ?? undefined,
      challengeId,
      emoji: "👏",
    });
  };
  
  // Delete participation
  const handleDeleteParticipation = () => {
    if (deleteTargetParticipation) {
      deleteParticipationMutation.mutate({ id: deleteTargetParticipation.id });
    }
  };
  
  return {
    // Share actions
    handleShare,
    handleTwitterShare,
    handleShareWithOgp,
    isGeneratingOgp,
    
    // Cheer actions
    handleSendCheer,
    
    // Delete participation
    showDeleteParticipationModal,
    setShowDeleteParticipationModal,
    deleteTargetParticipation,
    setDeleteTargetParticipation,
    handleDeleteParticipation,
    isDeleting: deleteParticipationMutation.isPending,
  };
}
