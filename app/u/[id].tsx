/**
 * プロフィール共有ルート
 * 
 * 外部共有用のURL: /u/{twitterId}-{slug}
 * 
 * 設計:
 * - twitterIdを主キーとして使用（usernameは変更され得るため）
 * - slugは表示用（不一致でもアクセス可能）
 * - 正規URLへリダイレクト
 */

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { trpc } from "@/lib/trpc";
import { extractIdFromSlug, getCanonicalProfileUrl, isCanonicalUrl } from "@/lib/slug";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useColors } from "@/hooks/use-colors";

// 既存のプロフィール画面コンポーネントを動的インポート
// import ProfileScreen from "@/app/profile/[userId]"; // 未使用

export default function SharedProfileScreen() {
  const colors = useColors();

  const pathname = usePathname();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // slugからtwitterIdを抽出
  const twitterId = id ? extractIdFromSlug(id) : null;
  
  // twitterIdからユーザー情報を取得
  const { data: user, isLoading, error } = (trpc.profiles as any).getByTwitterId.useQuery(
    { twitterId: twitterId || "" },
    { enabled: !!twitterId }
  );
  
  useEffect(() => {
    if (user) {
      setResolvedUserId(user.id);
      
      // 正規URLへのリダイレクト
      const canonicalUrl = getCanonicalProfileUrl(twitterId || "", user.twitterUsername || undefined);
      if (!isCanonicalUrl(pathname, canonicalUrl)) {
        setIsRedirecting(true);
        // 正規URLにリダイレクト（履歴を置換）
        navigateReplace.withUrl(canonicalUrl);
      }
    }
  }, [user, twitterId, pathname]);
  
  if (isLoading || isRedirecting) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">読み込み中...</Text>
      </ScreenContainer>
    );
  }
  
  if (error || !user) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-4">
        <Text className="text-foreground text-xl font-bold mb-2">
          ユーザーが見つかりません
        </Text>
        <Text className="text-muted text-center">
          このURLのユーザーは存在しないか、削除された可能性があります。
        </Text>
      </ScreenContainer>
    );
  }
  
  // 既存のプロフィール画面を表示（内部ではuserIdを使用）
  // Note: 実際の実装では、既存のProfileScreenをそのまま使うか、
  // 共通コンポーネントを抽出して使用する
  return (
    <View style={{ flex: 1 }}>
      {/* 既存のプロフィール画面にリダイレクト */}
      {resolvedUserId && (
        <ProfileScreenWrapper userId={resolvedUserId} />
      )}
    </View>
  );
}

// 既存のプロフィール画面をラップ
function ProfileScreenWrapper({ userId }: { userId: number }) {

  
  useEffect(() => {
    // 内部ルートにリダイレクト（ユーザーには見えない）
    navigateReplace.withUrl(`/profile/${userId}`);
  }, [userId]);
  
  return (
    <ScreenContainer className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </ScreenContainer>
  );
}
