/**
 * features/profile/hooks/use-profile-share.ts
 * プロフィール共有ロジック
 */

import { useMemo, useCallback } from "react";
import { Alert, Share } from "react-native";
import { getProfileShareUrl } from "@/lib/share";
import type { PublicProfile } from "../types";

interface UseProfileShareParams {
  profile: PublicProfile | null | undefined;
}

interface UseProfileShareReturn {
  profileShareUrl: string | null;
  handleShareProfile: () => Promise<boolean>;
}

export function useProfileShare({ profile }: UseProfileShareParams): UseProfileShareReturn {
  const profileShareUrl = useMemo(() => {
    if (!profile?.user?.twitterId) return null;
    return getProfileShareUrl(
      profile.user.twitterId,
      profile.user.username ?? undefined
    );
  }, [profile?.user?.twitterId, profile?.user?.username]);

  const copyProfileUrlFallback = useCallback(async (): Promise<boolean> => {
    if (!profileShareUrl) return false;
    if (typeof navigator !== "undefined") {
      const clipboard = (
        navigator as { clipboard?: { writeText?: (value: string) => Promise<void> } }
      ).clipboard;
      if (clipboard?.writeText) {
        try {
          await clipboard.writeText(profileShareUrl);
          Alert.alert(
            "URLをコピーしました",
            "共有に失敗したため、リンクだけクリップボードへコピーしました。"
          );
          return true;
        } catch (copyError) {
          console.warn("[Profile] clipboard copy failed", copyError);
        }
      }
    }
    Alert.alert(
      "エラー",
      `共有に失敗しました。以下のURLをコピーして手動で共有してください。\n${profileShareUrl}`
    );
    return false;
  }, [profileShareUrl]);

  const handleShareProfile = useCallback(async (): Promise<boolean> => {
    if (!profileShareUrl) {
      Alert.alert("シェアできません", "Twitter連携済みのプロフィールだけが共有できます");
      return false;
    }
    try {
      const result = await Share.share({
        title: `${profile?.user?.name ?? "プロフィール"} | 君斗りんくの動員ちゃれんじ`,
        message: `🎉 ${profile?.user?.name ?? "このプロフィール"}を応援しよう！\n${profileShareUrl}`,
        url: profileShareUrl,
      });
      return result.action === Share.sharedAction;
    } catch (error) {
      console.error("[Profile] share error", error);
      await copyProfileUrlFallback();
      return false;
    }
  }, [copyProfileUrlFallback, profile?.user?.name, profileShareUrl]);

  return { profileShareUrl, handleShareProfile };
}
