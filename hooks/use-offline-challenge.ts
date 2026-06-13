import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { enqueueAction } from "@/lib/offline-sync";
import { isOnline } from "@/lib/offline-cache";
import { trpc } from "@/lib/trpc";

interface ChallengeData {
  title: string;
  description?: string;
  eventDate: string;
  venue?: string;
  hostTwitterId: string; // 必須に変更
  hostName: string;
  hostUsername?: string;
  hostProfileImage?: string;
  hostFollowersCount?: number;
  hostDescription?: string;
}

interface UseOfflineChallengeOptions {
  onSuccess?: (id: number) => void;
  onError?: (error: Error) => void;
  onOfflineQueued?: () => void;
}

/**
 * オフライン対応のチャレンジ作成フック
 * オンライン時は直接APIを呼び出し、オフライン時はキューに追加
 */
export function useOfflineChallenge(options: UseOfflineChallengeOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQueued, setIsQueued] = useState(false);

  const createMutation = trpc.events.create.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      options.onSuccess?.(data.id as number);
    },
    onError: (error) => {
      setIsSubmitting(false);
      options.onError?.(new Error(error.message));
    },
  });

  const submit = useCallback(async (data: ChallengeData) => {
    setIsSubmitting(true);
    setIsQueued(false);

    const online = await isOnline();

    if (online) {
      // オンライン時は直接APIを呼び出し
      try {
        createMutation.mutate({
          title: data.title,
          description: data.description,
          eventDate: data.eventDate,
          venue: data.venue,
          hostName: data.hostName,
          hostUsername: data.hostUsername,
          hostProfileImage: data.hostProfileImage,
          hostFollowersCount: data.hostFollowersCount,
          hostDescription: data.hostDescription,
        });
      } catch (error) {
        // API呼び出し失敗時はキューに追加
        await enqueueOffline(data);
      }
    } else {
      // オフライン時はキューに追加
      await enqueueOffline(data);
    }
  }, [createMutation, options]);

  const enqueueOffline = async (data: ChallengeData) => {
    try {
      await enqueueAction("create_challenge", {
        ...data,
        queuedAt: Date.now(),
      });
      setIsSubmitting(false);
      setIsQueued(true);
      
      // オフラインキュー追加の通知
      if (Platform.OS === "web") {
        console.log("[OfflineChallenge] Queued for later sync");
      } else {
        Alert.alert(
          "オフラインで保存しました",
          "インターネット接続が復帰したら自動的に作成されます。",
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
    isPending: createMutation.isPending,
  };
}
