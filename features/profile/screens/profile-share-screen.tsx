import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  extractHandleFromSlug,
  extractIdFromSlug,
  getCanonicalProfileUrl,
  isCanonicalUrl,
} from "@/lib/slug";
import { navigate, navigateReplace } from "@/lib/navigation/app-routes";
import { color } from "@/theme/tokens";

interface ProfileShareScreenProps {
  slugParam: string;
  pathname: string;
}

export default function ProfileShareScreen({ slugParam, pathname }: ProfileShareScreenProps) {
  const colors = useColors();
  const decodedSlug = decodeURIComponent(slugParam ?? "");
  const handle = decodedSlug.startsWith("@") ? extractHandleFromSlug(decodedSlug) : null;
  const legacyTwitterId = /^\d+/.test(decodedSlug) ? extractIdFromSlug(decodedSlug) : null;
  const fallbackTwitterId = !handle && !legacyTwitterId && decodedSlug ? decodedSlug : null;

  const {
    data: handleUser,
    isLoading: handleLoading,
    error: handleError,
  } = trpc.profiles.getByTwitterUsername.useQuery(
    { username: handle ?? "" },
    { enabled: !!handle },
  );

  const twitterIdQuery = legacyTwitterId ?? fallbackTwitterId ?? null;
  const {
    data: legacyUser,
    isLoading: legacyLoading,
    error: legacyError,
  } = trpc.profiles.getByTwitterId.useQuery(
    { twitterId: twitterIdQuery ?? "" },
    { enabled: !!twitterIdQuery },
  );

  const user = handleUser ?? legacyUser;
  const isLoading = handleLoading || legacyLoading;
  const error = handleError ?? legacyError;
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user) {
      setResolvedUserId(user.id);
      if (user.twitterId && user.twitterUsername) {
        const canonicalUrl = getCanonicalProfileUrl(user.twitterId, user.twitterUsername);
        if (!isCanonicalUrl(pathname, canonicalUrl)) {
          setIsRedirecting(true);
          navigateReplace.withUrl(canonicalUrl);
          return;
        }
      }
      setIsRedirecting(false);
    }
  }, [user, pathname]);

  if (!slugParam) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground text-lg">プロフィールURLが無効です。</Text>
      </ScreenContainer>
    );
  }

  if (isLoading || isRedirecting) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="プロフィールを読み込み中"
        />
        <Text className="text-muted mt-4">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  if (error || !user) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-4">
        <Text className="text-foreground text-xl font-bold mb-2">ユーザーが見つかりません</Text>
        <Text className="text-muted text-center">このURLのユーザーは存在しないか、削除された可能性があります。</Text>
        <Pressable
          onPress={navigate.toHome}
          accessibilityRole="button"
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>ホームへ戻る</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {resolvedUserId && <ProfileScreenRedirect userId={resolvedUserId} />}
    </View>
  );
}

function ProfileScreenRedirect({ userId }: { userId: number }) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    navigateReplace.withUrl(`/profile/${userId}`);

    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [userId]);

  return (
    <ScreenContainer className="flex-1 items-center justify-center">
      <ActivityIndicator
        size="large"
        accessibilityLabel="プロフィールページへ移動中"
      />
      {showFallback && (
        <Pressable
          onPress={navigate.toHome}
          accessibilityRole="button"
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>ホームへ</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: color.borderAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: color.textPrimary,
  },
});
