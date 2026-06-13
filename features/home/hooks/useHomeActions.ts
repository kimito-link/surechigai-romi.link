/**
 * useHomeActions Hook
 * ホーム画面のアクション（ナビゲーション、削除等）
 * v6.38: navigateに移行
 */

import { navigate } from "@/lib/navigation";
import { trpc } from "@/lib/trpc";
import { showAlert } from "@/lib/web-alert";

interface UseHomeActionsOptions {
  refetch: () => Promise<void>;
}

interface UseHomeActionsReturn {
  handleChallengePress: (challengeId: number) => void;
  handleChallengeEdit: (challengeId: number) => void;
  handleChallengeDelete: (challengeId: number) => void;
  handleCreateChallenge: () => void;
  isDeleting: boolean;
}

export function useHomeActions({ refetch }: UseHomeActionsOptions): UseHomeActionsReturn {
  // tRPC utils for prefetching
  const utils = trpc.useUtils();
  
  // チャレンジ削除ミューテーション
  const deleteChallengeMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      refetch();
      showAlert("削除完了", "チャレンジを削除しました");
    },
    onError: (error) => {
      showAlert("エラー", error.message || "削除に失敗しました");
    },
  });

  const handleChallengePress = (challengeId: number) => {
    // プリフェッチ: イベント詳細画面のデータを事前に取得
    utils.events.getById.prefetch({ id: challengeId });
    navigate.toEventDetail(challengeId);
  };

  const handleChallengeEdit = (challengeId: number) => {
    navigate.toEditChallenge(challengeId);
  };

  const handleChallengeDelete = (challengeId: number) => {
    showAlert(
      "チャレンジを削除",
      "このチャレンジを削除しますか？\n参加者のデータも全て削除されます。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: () => deleteChallengeMutation.mutate({ id: challengeId }),
        },
      ]
    );
  };

  const handleCreateChallenge = () => {
    navigate.toCreateTab();
  };

  return {
    handleChallengePress,
    handleChallengeEdit,
    handleChallengeDelete,
    handleCreateChallenge,
    isDeleting: deleteChallengeMutation.isPending,
  };
}
