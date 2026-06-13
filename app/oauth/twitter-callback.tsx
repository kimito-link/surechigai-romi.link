// v5.39: description field support

import * as Auth from "@/lib/_core/auth";
import { useLocalSearchParams } from "expo-router";
import { navigateReplace } from "@/lib/navigation/app-routes";
import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Text, View, Pressable, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveAccount } from "@/lib/account-manager";
import { Image } from "expo-image";
import { BlinkingLink } from "@/components/atoms/blinking-character";
import { CelebrationAnimation } from "@/components/molecules/celebration-animation";
import { FollowSuccessModal } from "@/components/molecules/follow-success-modal";
import { PrefectureSelector } from "@/components/ui/prefecture-selector";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { color } from "@/theme/tokens";
import * as Api from "@/lib/_core/api";
import type { Gender } from "@/types/participation";

// 画像アセット
const APP_LOGO = require("@/assets/images/logos/kimitolink-logo.jpg");

// キャラクター画像（各状態用）
const CHARACTER_IMAGES = {
  // 成功：笑顔（口開け）
  success: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  // エラー：困った表情（半目）
  error: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-open.png"),
  // ネットワークエラー：目をつぶった表情
  networkError: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-closed.png"),
  // キャンセル：困った表情（口閉じ）
  cancelled: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-closed.png"),
  // 有効期限切れ：まばたき
  expired: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-open.png"),
};

// エラータイプ
type ErrorType = "network" | "cancelled" | "expired" | "general";

const FOLLOW_SUCCESS_SHOWN_KEY = "follow_success_modal_shown";

export default function TwitterOAuthCallback() {

  const params = useLocalSearchParams<{
    data?: string;
    error?: string;
    sessionToken?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>("general");
  const [savedReturnUrl, setSavedReturnUrl] = useState<string>("/(tabs)/mypage");
  const [needOnboarding, setNeedOnboarding] = useState(false);
  const [onboardingPrefecture, setOnboardingPrefecture] = useState("");
  const [onboardingGender, setOnboardingGender] = useState<Gender>("unspecified");
  const [showPrefectureList, setShowPrefectureList] = useState(false);
  const [targetAccountInfo, setTargetAccountInfo] = useState<Auth.User["targetAccount"] | null>(null);
  const [showFollowSuccessModal, setShowFollowSuccessModal] = useState(false);
  const isFollowingRef = useRef(false);

  const updateProfileMutation = trpc.profiles.updateMyProfile.useMutation({
    onSuccess: async (data) => {
      try {
        if (data?.user) {
          const existing = await Auth.getUserInfo();
          if (existing) {
            await Auth.setUserInfo({
              ...existing,
              prefecture: data.user.prefecture ?? existing.prefecture,
              gender: data.user.gender ?? existing.gender,
              role: data.user.role ?? existing.role,
            });
          }
        }
        setNeedOnboarding(false);
        const url = savedReturnUrl;
        setTimeout(() => {
          navigateReplace.withUrl(url);
          // Web: router.replace が効かない場合のフォールバック
          if (Platform.OS === "web" && typeof window !== "undefined") {
            const targetPath = url.startsWith("/(tabs)/") ? url.replace("/(tabs)/", "/") : url;
            setTimeout(() => {
              if (window.location.pathname.includes("oauth")) {
                window.location.href = targetPath || "/mypage";
              }
            }, 400);
          }
        }, 100);
      } catch (error) {
        console.error("[Twitter OAuth] Failed to update user info:", error);
        setNeedOnboarding(false);
        navigateReplace.withUrl(savedReturnUrl);
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const targetPath = savedReturnUrl.startsWith("/(tabs)/") ? savedReturnUrl.replace("/(tabs)/", "/") : savedReturnUrl;
          setTimeout(() => {
            if (window.location.pathname.includes("oauth")) {
              window.location.href = targetPath || "/mypage";
            }
          }, 400);
        }
      }
    },
    onError: (error) => {
      console.error("[Twitter OAuth] updateMyProfile mutation failed:", error);
      // エラー状態を設定してユーザーにフィードバック（根本的解決: エラーを可視化）
      setErrorMessage(error.message || "プロフィールの更新に失敗しました。もう一度お試しください。");
      setErrorType("general");
      // エラーでもオンボーディングを閉じる（ユーザーが「あとで設定する」を選択できるように）
      // setNeedOnboarding(false); // コメントアウト: エラー時はオンボーディングを継続
    },
  });
  const colors = useColors();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[Twitter OAuth] Callback handler triggered");
      console.log("[Twitter OAuth] Params received:", {
        data: params.data ? "present" : "missing",
        error: params.error,
      });

      try {
        // Check for error
        if (params.error) {
          console.error("[Twitter OAuth] Error parameter found:", params.error);
          setStatus("error");
          
          // エラーデータをパース（JSON形式の場合）
          try {
            const errorData = JSON.parse(decodeURIComponent(params.error));
            if (errorData.code === "access_denied") {
              // ユーザーが認証をキャンセルした場合
              setErrorMessage("認証がキャンセルされました。ログインするにはTwitter認証を許可してください。");
              setErrorType("cancelled");
            } else if (errorData.message) {
              // ユーザーフレンドリーなエラーメッセージに変換
              if (errorData.message.includes("fetch failed") || errorData.message.includes("network")) {
                setErrorMessage("ネットワークエラーが発生しました。もう一度お試しください。");
                setErrorType("network");
              } else if (errorData.message.includes("Invalid or expired state")) {
                setErrorMessage("認証の有効期限が切れました。もう一度ログインしてください。");
                setErrorType("expired");
              } else if (errorData.message.includes("exchange code")) {
                setErrorMessage("Twitter認証に失敗しました。もう一度お試しください。");
                setErrorType("general");
              } else {
                setErrorMessage(errorData.message);
                setErrorType("general");
              }
            } else {
              setErrorMessage("認証に失敗しました");
              setErrorType("general");
            }
          } catch {
            // JSONパースに失敗した場合はそのまま表示
            setErrorMessage(params.error);
          }
          return;
        }

        // Check for data
        if (!params.data) {
          console.error("[Twitter OAuth] Missing data parameter");
          setStatus("error");
          setErrorMessage("認証データが見つかりません");
          return;
        }

        // Parse user data
        try {
          const userData = JSON.parse(decodeURIComponent(params.data));
          console.log("[Twitter OAuth] User data parsed:", {
            twitterId: userData.twitterId,
            username: userData.username,
            name: userData.name,
            description: userData.description,
          });

          // Convert Twitter user data to Auth.User format
          // BFFパターン: トークンはサーバー側で管理するため、クライアントには渡さない
          const userInfo: Auth.User = {
            id: parseInt(userData.twitterId) || 0,
            openId: `twitter:${userData.twitterId}`,
            name: userData.name,
            email: null,
            loginMethod: "twitter",
            lastSignedIn: new Date(),
            // Twitter specific fields (プロフィール情報のみ、トークンは含まない)
            username: userData.username,
            profileImage: userData.profileImage,
            followersCount: userData.followersCount,
            description: userData.description,
            twitterId: userData.twitterId,
            isFollowingTarget: userData.isFollowingTarget,
            targetAccount: userData.targetAccount,
          };

          await Auth.setUserInfo(userInfo);

          // Webプラットフォームの場合、セッションCookieを確立（リトライ付き）
          if (Platform.OS === "web" && typeof window !== "undefined") {
            // BUG-002修正: URLからセッショントークンを即座に除去（ブラウザ履歴/Referer漏洩防止）
            try {
              window.history.replaceState(null, "", "/oauth/twitter-callback");
            } catch { /* ignore */ }
            const sessionToken = params.sessionToken;
            let sessionEstablished = false;
            
            if (sessionToken) {
              // セッショントークンがURLパラメータにある場合、Cookieを確立（最大2回リトライ）
              for (let sessionRetry = 0; sessionRetry < 2; sessionRetry++) {
                try {
                  console.log(`[Twitter OAuth] Establishing session (attempt ${sessionRetry + 1}/2)...`);
                  const result = await Promise.race([
                    Api.establishSession(sessionToken),
                    new Promise<false>((resolve) => setTimeout(() => resolve(false), 5000)),
                  ]);
                  
                  if (result) {
                    await Auth.setSessionToken(sessionToken);
                    sessionEstablished = true;
                    console.log("[Twitter OAuth] Session established successfully");
                    await new Promise(resolve => setTimeout(resolve, 300));
                    break;
                  } else {
                    console.warn(`[Twitter OAuth] Session establishment ${sessionRetry === 0 ? "timed out" : "failed"}, ${sessionRetry < 1 ? "retrying..." : "continuing without session"}`);
                    if (sessionRetry === 0) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                  }
                } catch (sessionError) {
                  console.warn(`[Twitter OAuth] Session establish error (attempt ${sessionRetry + 1}):`, sessionError);
                  if (sessionRetry === 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
              }
              
              // セッション確立に失敗しても、トークンは保存しておく（useAuthが再試行する）
              if (!sessionEstablished) {
                console.warn("[Twitter OAuth] Session establishment failed after retries, saving token for later");
                await Auth.setSessionToken(sessionToken);
              }
            } else {
              // セッショントークンがない場合、サーバー側で設定されたCookieを使用
              console.log("[Twitter OAuth] No session token in URL, using server-set cookie");
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Merge prefecture/gender/role from server (DB) when session is available（getUserInfo は必要時のみ1回）
          let storedInfo: Auth.User | null = null;
          
          // Webプラットフォームの場合、セッション確立後にgetMeを呼び出す
          if (Platform.OS === "web" && typeof window !== "undefined") {
            // セッション確立を待つ（最大3回リトライ、各リトライにタイムアウト付き）
            let me = null;
            for (let retry = 0; retry < 3; retry++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 500 * (retry + 1)));
                // 各リトライに5秒のタイムアウトを設定
                me = await Promise.race([
                  Api.getMe(),
                  new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
                ]);
                if (me) {
                  console.log("[Twitter OAuth] getMe succeeded on attempt", retry + 1);
                  break;
                }
                console.warn(`[Twitter OAuth] getMe returned null on attempt ${retry + 1}`);
              } catch (getMeError) {
                console.warn(`[Twitter OAuth] getMe failed on attempt ${retry + 1}:`, getMeError);
                if (retry === 2) {
                  console.warn("[Twitter OAuth] getMe failed after 3 attempts, session may not be available yet");
                }
              }
            }
            
            if (me && (me.prefecture !== undefined || me.gender !== undefined || me.role !== undefined)) {
              const merged: Auth.User = {
                ...userInfo,
                prefecture: me.prefecture ?? userInfo.prefecture ?? null,
                gender: me.gender ?? userInfo.gender ?? null,
                role: me.role ?? userInfo.role ?? undefined,
              };
              await Auth.setUserInfo(merged);
              storedInfo = merged;
            }
          } else {
            // Nativeプラットフォームの場合、通常通りgetMeを呼び出す
            try {
              const me = await Api.getMe();
              if (me && (me.prefecture !== undefined || me.gender !== undefined || me.role !== undefined)) {
                const merged: Auth.User = {
                  ...userInfo,
                  prefecture: me.prefecture ?? userInfo.prefecture ?? null,
                  gender: me.gender ?? userInfo.gender ?? null,
                  role: me.role ?? userInfo.role ?? undefined,
                };
                await Auth.setUserInfo(merged);
                storedInfo = merged;
              }
            } catch (getMeError) {
              console.warn("[Twitter OAuth] getMe failed, session may not be available yet:", getMeError);
              // Session may not be available yet; useAuth will merge on next fetch
            }
          }
          
          if (!storedInfo) {
            storedInfo = await Auth.getUserInfo();
          }

          // BFFパターン: トークンはサーバー側で管理（クライアントに保存しない）

          // アカウントを保存（複数アカウント切り替え用）
          await saveAccount({
            id: userData.twitterId,
            username: userData.username,
            displayName: userData.name,
            profileImageUrl: userData.profileImage,
          });
          console.log("[Twitter OAuth] Account saved for multi-account switching");

          setStatus("success");
          console.log("[Twitter OAuth] Authentication successful");

          // ログイン前に保存したリダイレクト先を取得
          let returnUrl = "/(tabs)/mypage";
          if (typeof window !== "undefined") {
            const savedUrl = localStorage.getItem("auth_return_url");
            if (savedUrl) {
              returnUrl = savedUrl;
              localStorage.removeItem("auth_return_url");
              console.log("[Twitter OAuth] Using saved return URL:", returnUrl);
            }
          }
          setSavedReturnUrl(returnUrl);

          // 都道府県未設定 or 性別未設定ならオンボーディングを表示
          const needsProfile =
            !storedInfo?.prefecture ||
            storedInfo?.gender === "unspecified" ||
            !storedInfo?.gender ||
            (storedInfo?.gender as string) === "";
          setNeedOnboarding(!!needsProfile);

          if (!needsProfile) {
            // フォローしている場合はお祝いモーダルを表示
            if (userData.isFollowingTarget) {
              isFollowingRef.current = true;
              setTargetAccountInfo(userData.targetAccount);

              const hasShownBefore = await AsyncStorage.getItem(FOLLOW_SUCCESS_SHOWN_KEY);
              if (!hasShownBefore) {
                setShowFollowSuccessModal(true);
                await AsyncStorage.setItem(FOLLOW_SUCCESS_SHOWN_KEY, "true");
              } else {
                setTimeout(() => {
                  navigateReplace.withUrl(returnUrl);
                }, 1500);
              }
            } else {
              setTimeout(() => {
                navigateReplace.withUrl(returnUrl);
              }, 1500);
            }
          }
        } catch (parseError) {
          console.error("[Twitter OAuth] Failed to parse user data:", parseError);
          setStatus("error");
          setErrorMessage("認証データの解析に失敗しました");
        }
      } catch (error) {
        console.error("[Twitter OAuth] Callback error:", error);
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
            {/* ロゴ */}
            <Image
              source={APP_LOGO}
              style={{ width: 120, height: 40 }}
              contentFit="contain"
            />
            
            {/* キャラクター（まばたきアニメーション付き） */}
            <BlinkingLink
              variant="normalClosed"
              size={100}
              blinkInterval={2500}
              style={{ marginVertical: 12 }}
            />
            
            <ActivityIndicator size="large" color={color.accentPrimary} />
            <Text className="mt-2 text-base leading-6 text-center text-foreground">
              認証を完了しています...
            </Text>
          </View>
        )}
        {status === "success" && needOnboarding && (
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
            <Image
              source={APP_LOGO}
              style={{ width: 120, height: 40, alignSelf: "center", marginBottom: 24 }}
              contentFit="contain"
            />
            <Text className="text-lg font-semibold text-center text-foreground mb-2">
              プロフィールを設定
            </Text>
            <Text className="text-sm text-center text-muted-foreground mb-6">
              参加表明がスムーズになります（あとで変更可能）
            </Text>
            <PrefectureSelector
              value={onboardingPrefecture}
              onChange={setOnboardingPrefecture}
              isOpen={showPrefectureList}
              onOpenChange={setShowPrefectureList}
              label="都道府県"
              placeholder="選択してください"
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: color.textSecondary, fontSize: 14, marginBottom: 8 }}>性別（任意）</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {(["male", "female", "unspecified"] as const).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setOnboardingGender(g)}
                    style={{
                      flex: 1,
                      backgroundColor: onboardingGender === g ? color.info : colors.background,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: onboardingGender === g ? color.info : color.border,
                    }}
                  >
                    <Text
                      style={{
                        color: onboardingGender === g ? color.textWhite : color.textSecondary,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {g === "male" ? "男性" : g === "female" ? "女性" : "無回答"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              onPress={async () => {
                setShowPrefectureList(false); // ドロップダウンを閉じてクリック領域を確保
                // Webプラットフォームの場合、セッションが確立されているか確認
                if (Platform.OS === "web" && typeof window !== "undefined") {
                  try {
                    const me = await Api.getMe();
                    if (!me) {
                      console.error("[Twitter OAuth] Session not established, cannot update profile");
                      setErrorMessage("セッションが確立されていません。ページを再読み込みしてください。");
                      setErrorType("general");
                      return;
                    }
                  } catch (sessionError) {
                    console.error("[Twitter OAuth] Session check failed:", sessionError);
                    setErrorMessage("セッションの確認に失敗しました。ページを再読み込みしてください。");
                    setErrorType("general");
                    return;
                  }
                }

                updateProfileMutation.mutate({
                  prefecture: onboardingPrefecture || null,
                  gender: onboardingGender,
                });
              }}
              disabled={updateProfileMutation.isPending}
              style={({ pressed }) => ({
                backgroundColor: color.accentPrimary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 8,
                opacity: updateProfileMutation.isPending ? 0.6 : pressed ? 0.9 : 1,
                minHeight: 48,
                cursor: Platform.OS === "web" ? "pointer" : undefined,
              })}
            >
              <Text style={{ color: color.textWhite, fontWeight: "600", fontSize: 16 }}>
                {updateProfileMutation.isPending ? "保存中..." : "確定"}
              </Text>
            </Pressable>
            {/* エラーメッセージ表示（根本的解決: エラーを可視化） */}
            {updateProfileMutation.isError && updateProfileMutation.error && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: `${color.danger}20`, borderRadius: 8, borderWidth: 1, borderColor: color.danger }}>
                <Text style={{ color: color.danger, fontSize: 14, textAlign: "center" }}>
                  {updateProfileMutation.error.message || "プロフィールの更新に失敗しました"}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => {
                setShowPrefectureList(false);
                setNeedOnboarding(false);
                navigateReplace.withUrl(savedReturnUrl);
                // Web: router.replace が効かない場合のフォールバック（500ms後に強制遷移）
                if (Platform.OS === "web" && typeof window !== "undefined") {
                  const targetPath = savedReturnUrl.startsWith("/(tabs)/") ? savedReturnUrl.replace("/(tabs)/", "/") : savedReturnUrl;
                  setTimeout(() => {
                    if (window.location.pathname.includes("oauth")) {
                      window.location.href = targetPath || "/mypage";
                    }
                  }, 500);
                }
              }}
              style={({ pressed }) => ({
                alignItems: "center",
                marginTop: 16,
                paddingVertical: 12,
                minHeight: 44,
                opacity: pressed ? 0.8 : 1,
                cursor: Platform.OS === "web" ? "pointer" : undefined,
              })}
            >
              <Text style={{ color: color.accentPrimary, fontSize: 14, fontWeight: "600" }}>あとで設定する</Text>
            </Pressable>
          </ScrollView>
        )}
        {status === "success" && !needOnboarding && (
          <View className="items-center justify-center gap-4">
            <CelebrationAnimation
              visible={true}
              characterSize={120}
              showConfetti={true}
            />
            <Image
              source={APP_LOGO}
              style={{ width: 120, height: 40, marginTop: 140 }}
              contentFit="contain"
            />
            <Text className="text-xl font-bold text-center text-success">
              認証成功！
            </Text>
            <Text className="text-base leading-6 text-center text-muted">
              リダイレクトしています...
            </Text>
          </View>
        )}
        {status === "error" && (
          <View className="items-center justify-center gap-4">
            {/* ロゴ */}
            <Image
              source={APP_LOGO}
              style={{ width: 120, height: 40 }}
              contentFit="contain"
            />
            
            {/* キャラクター（エラー種別に応じた表情） */}
            <Image
              source={
                errorType === "network" ? CHARACTER_IMAGES.networkError :
                errorType === "cancelled" ? CHARACTER_IMAGES.cancelled :
                errorType === "expired" ? CHARACTER_IMAGES.expired :
                CHARACTER_IMAGES.error
              }
              style={{ width: 120, height: 120, marginVertical: 16 }}
              contentFit="contain"
            />
            
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              認証に失敗しました
            </Text>
            <Text className="text-base leading-6 text-center text-foreground px-4">
              {errorMessage}
            </Text>
            <Text
              className="mt-4 text-primary underline"
              onPress={() => {
                // マイページに戻って再ログインを促す
                navigateReplace.toMypageTab();
              }}
            >
              マイページに戻って再ログイン
            </Text>
          </View>
        )}
        

      </View>
      <FollowSuccessModal
        visible={showFollowSuccessModal}
        onClose={() => {
          setShowFollowSuccessModal(false);
          navigateReplace.withUrl(savedReturnUrl);
        }}
        targetUsername={targetAccountInfo?.username}
        targetDisplayName={targetAccountInfo?.name}
      />
    </SafeAreaView>
  );
}
