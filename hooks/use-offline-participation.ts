import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { enqueueAction } from "@/lib/offline-sync";
import { isOnline } from "@/lib/offline-cache";
import { trpc } from "@/lib/trpc";

interface ParticipationData {
  challengeId: number;
  twitterId?: string;
  displayName: string;
  username?: string;
  profileImage?: string;
  followersCount?: number;
  message?: string;
  companionCount?: number;
  prefecture?: string;
  companions?: Array<{
    displayName: string;
    twitterUsername?: string;
    twitterId?: string;
    profileImage?: string;
  }>;
  isAnonymous?: boolean;
}

interface UseOfflineParticipationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onOfflineQueued?: () => void;
}

/**
 * オフライン対応の参加表明フック
 * オンライン時は直接APIを呼び出し、オフライン時はキューに追加
 */
export function useOfflineParticipation(options: UseOfflineParticipationOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQueued, setIsQueued] = useState(false);

  const createMutation = trpc.participations.create.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      options.onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      options.onError?.(new Error(error.message));
    },
  });

  const createAnonymousMutation = trpc.participations.createAnonymous.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      options.onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      options.onError?.(new Error(error.message));
    },
  });

  const submit = useCallback(async (data: ParticipationData) => {
    setIsSubmitting(true);
    setIsQueued(false);

    const online = await isOnline();

    if (online) {
      // オンライン時は直接APIを呼び出し
      try {
        if (data.isAnonymous) {
          createAnonymousMutation.mutate({
            challengeId: data.challengeId,
            displayName: data.displayName,
            message: data.message,
            companionCount: data.companionCount,
            prefecture: data.prefecture,
            companions: data.companions,
          });
        } else {
          createMutation.mutate({
            challengeId: data.challengeId,
            displayName: data.displayName,
            username: data.username,
            profileImage: data.profileImage,
            message: data.message,
            companionCount: data.companionCount,
            prefecture: data.prefecture,
            companions: data.companions,
          });
        }
      } catch (error) {
        // API呼び出し失敗時はキューに追加
        await enqueueOffline(data);
      }
    } else {
      // オフライン時はキューに追加
      await enqueueOffline(data);
    }
  }, [createMutation, createAnonymousMutation, options]);

  const enqueueOffline = async (data: ParticipationData) => {
    try {
      await enqueueAction("participate", {
        ...data,
        queuedAt: Date.now(),
      });
      setIsSubmitting(false);
      setIsQueued(true);
      
      // オフラインキュー追加の通知
      if (Platform.OS === "web") {
        console.log("[OfflineParticipation] Queued for later sync");
      } else {
        Alert.alert(
          "オフラインで保存しました",
          "インターネット接続が復帰したら自動的に送信されます。",
          [{ text: "OK" }]
        );
      }
      
      options.onOfflineQueued?.();
    } catch (error) {
      setIsSubmitting(false);
      const err = error instanceof Error ? error : new Error("キューへの追加に失敗しました");
      options.onError?.(err);
    }
  };

  return {
    submit,
    isSubmitting,
    isQueued,
    isPending: createMutation.isPending || createAnonymousMutation.isPending,
  };
}
