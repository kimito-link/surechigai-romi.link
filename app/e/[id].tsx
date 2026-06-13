/**
 * イベント共有ルート
 * 
 * 外部共有用のURL: /e/{challengeId}-{slug}
 * 
 * 設計:
 * - challengeIdを主キーとして使用
 * - slugは表示用（不一致でもアクセス可能）
 * - 正規URLへリダイレクト
 */

import { useEffect, useState } from "react";
import { Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { trpc } from "@/lib/trpc";
import { extractIdFromSlug, getCanonicalEventUrl, isCanonicalUrl } from "@/lib/slug";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function SharedEventScreen() {
  const colors = useColors();

  const pathname = usePathname();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // slugからchallengeIdを抽出
  const challengeId = id ? extractIdFromSlug(id) : null;
  const parsedChallengeId = challengeId ? parseInt(challengeId, 10) : null;
  
  // challengeIdからイベント情報を取得
  const { data: challenge, isLoading, error } = trpc.events.getById.useQuery(
    { id: parsedChallengeId || 0 },
    { enabled: !!parsedChallengeId }
  );
  
  useEffect(() => {
    if (challenge && parsedChallengeId) {
      // 正規URLへのリダイレクト確認
      const canonicalUrl = getCanonicalEventUrl(parsedChallengeId, challenge.title);
      if (!isCanonicalUrl(pathname, canonicalUrl)) {
        setIsRedirecting(true);
        // 正規URLにリダイレクト（履歴を置換）
        navigateReplace.withUrl(canonicalUrl);
        return;
      }
      
      // 内部ルートにリダイレクト
      setIsRedirecting(true);
      navigateReplace.withUrl(`/event/${parsedChallengeId}`);
    }
  }, [challenge, parsedChallengeId, pathname]);
  
  if (isLoading || isRedirecting) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">読み込み中...</Text>
      </ScreenContainer>
    );
  }
  
  if (error || !challenge) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-4">
        <Text className="text-foreground text-xl font-bold mb-2">
          イベントが見つかりません
        </Text>
        <Text className="text-muted text-center">
          このURLのイベントは存在しないか、削除された可能性があります。
        </Text>
      </ScreenContainer>
    );
  }
  
  // リダイレクト中の表示
  return (
    <ScreenContainer className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={colors.primary} />
    </ScreenContainer>
  );
}
