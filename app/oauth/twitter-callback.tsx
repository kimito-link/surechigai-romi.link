/**
 * Twitter OAuth コールバック画面
 * 君斗りんくのすれ違ひ通信: 認証後にホームへリダイレクト
 */

import * as Auth from "@/lib/_core/auth";
import { useLocalSearchParams } from "expo-router";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveAccount } from "@/lib/account-manager";
import { color } from "@/theme/tokens";
import * as Api from "@/lib/_core/api";

export default function TwitterOAuthCallback() {
  const params = useLocalSearchParams<{
    data?: string;
    error?: string;
    sessionToken?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (params.error) {
          setStatus("error");
          try {
            const errorData = JSON.parse(decodeURIComponent(params.error));
            setErrorMessage(errorData.message ?? "認証に失敗しました");
          } catch {
            setErrorMessage(params.error);
          }
          return;
        }

        if (!params.data) {
          setStatus("error");
          setErrorMessage("認証データが見つかりません");
          return;
        }

        const userData = JSON.parse(decodeURIComponent(params.data));

        const userInfo: Auth.User = {
          id: parseInt(userData.twitterId) || 0,
          openId: `twitter:${userData.twitterId}`,
          name: userData.name,
          email: null,
          loginMethod: "twitter",
          lastSignedIn: new Date(),
          username: userData.username,
          profileImage: userData.profileImage,
          followersCount: userData.followersCount,
          description: userData.description,
          twitterId: userData.twitterId,
          isFollowingTarget: userData.isFollowingTarget,
          targetAccount: userData.targetAccount,
        };

        await Auth.setUserInfo(userInfo);

        if (Platform.OS === "web" && typeof window !== "undefined") {
          try {
            window.history.replaceState(null, "", "/oauth/twitter-callback");
          } catch { /* ignore */ }
          const sessionToken = params.sessionToken;
          if (sessionToken) {
            try {
              const result = await Promise.race([
                Api.establishSession(sessionToken),
                new Promise<false>((resolve) => setTimeout(() => resolve(false), 5000)),
              ]);
              if (result) {
                await Auth.setSessionToken(sessionToken);
              } else {
                await Auth.setSessionToken(sessionToken);
              }
            } catch {
              await Auth.setSessionToken(params.sessionToken!);
            }
          }
        }

        await saveAccount({
          id: userData.twitterId,
          username: userData.username,
          displayName: userData.name,
          profileImageUrl: userData.profileImage,
        });

        setStatus("success");

        let returnUrl = "/";
        if (typeof window !== "undefined") {
          const savedUrl = localStorage.getItem("auth_return_url");
          if (savedUrl) {
            returnUrl = savedUrl;
            localStorage.removeItem("auth_return_url");
          }
        }

        setTimeout(() => {
          navigateReplace.withUrl(returnUrl);
          if (Platform.OS === "web" && typeof window !== "undefined") {
            setTimeout(() => {
              if (window.location.pathname.includes("oauth")) {
                window.location.href = returnUrl || "/";
              }
            }, 400);
          }
        }, 1000);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "認証の完了に失敗しました"
        );
      }
    };

    handleCallback();
  }, [params.data, params.error, params.sessionToken]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <View className="items-center justify-center gap-4">
            <ActivityIndicator size="large" color={color.accentPrimary} />
            <Text className="mt-2 text-base leading-6 text-center text-foreground">
              認証を完了しています...
            </Text>
          </View>
        )}
        {status === "success" && (
          <View className="items-center justify-center gap-4">
            <Text className="text-xl font-bold text-center text-foreground">
              認証成功！
            </Text>
            <Text className="text-base leading-6 text-center text-muted-foreground">
              リダイレクトしています...
            </Text>
          </View>
        )}
        {status === "error" && (
          <View className="items-center justify-center gap-4">
            <Text className="mb-2 text-xl font-bold leading-7 text-foreground">
              認証に失敗しました
            </Text>
            <Text className="text-base leading-6 text-center text-foreground px-4">
              {errorMessage}
            </Text>
            <Text
              className="mt-4 text-primary underline"
              onPress={() => navigateReplace.withUrl("/")}
            >
              ホームに戻る
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
