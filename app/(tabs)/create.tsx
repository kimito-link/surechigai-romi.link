// app/(tabs)/create.tsx
// v6.60: 作成完了モーダル（チェックリスト＋告知文コピー）追加
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useFollowStatus } from "@/hooks/use-follow-status";
import { useResponsive } from "@/hooks/use-responsive";
import { useColors } from "@/hooks/use-colors";
import { useAuthUxMachine } from "@/hooks/use-auth-ux-machine";
import { FollowPromptBanner } from "@/components/molecules/follow-gate";
import { AppHeader } from "@/components/organisms/app-header";
import { LoginModal } from "@/components/common/LoginModal";
import { RedirectingScreen, WaitingReturnScreen } from "@/components/auth-ux";
import { SuccessScreen } from "@/components/molecules/auth-ux/SuccessScreen";
import { CancelScreen } from "@/components/molecules/auth-ux/CancelScreen";
import { ErrorScreen } from "@/components/molecules/auth-ux/ErrorScreen";
import { useCreateChallenge, CreateChallengeForm } from "@/features/create";
import { ChallengeCreatedModal } from "@/components/molecules/challenge-created-modal";

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像を統一使用）
const characterImages = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

export default function CreateChallengeScreen() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const { isFollowing, targetUsername, targetDisplayName } = useFollowStatus();
  const { isDesktop } = useResponsive();
  const colors = useColors();
  const { state: authState, tapLogin, confirmYes, confirmNo, retry, backWithoutLogin } = useAuthUxMachine();
  
  // カテゴリ一覧を取得（ある場合のみカテゴリ選択UIを表示）
  const { data: categoriesData, isLoading: isCategoriesLoading } = trpc.categories.list.useQuery();
  
  // チャレンジ作成フック
  const {
    state,
    updateField,
    handleGoalTypeChange,
    applyPreset,
    handleCreate,
    validationErrors,
    isPending,
    closeCreatedModal,
    resetForm,
    refs,
  } = useCreateChallenge();
  
  // モーダルを閉じてフォームをリセット
  const handleCloseModal = () => {
    closeCreatedModal();
    resetForm();
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          ref={refs.scrollViewRef}
          style={{ flex: 1, backgroundColor: colors.background }}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          directionalLockEnabled={true}
          bounces={true}
          alwaysBounceHorizontal={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* ヘッダー（未ログイン時は共通ログインボタン表示） */}
          <AppHeader 
            title="君斗りんくの動員ちゃれんじ" 
            showCharacters={false}
            isDesktop={isDesktop}
            showMenu={true}
            showLoginButton={true}
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>
              チャレンジ作成
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
              目標を設定してファンと一緒に達成しよう
            </Text>
          </View>

          {/* キャラクター */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 16 }}>
            <Image source={characterImages.konta} style={{ width: 50, height: 50 }} contentFit="contain" />
            <View style={{ alignItems: "center", marginHorizontal: 8 }}>
              <Image source={characterImages.rinku} style={{ width: 70, height: 70 }} contentFit="contain" />
            </View>
            <Image source={characterImages.tanune} style={{ width: 50, height: 50 }} contentFit="contain" />
          </View>

          {/* フォロー促進バナー（認証確定かつ未フォロー時のみ表示・点滅防止） */}
          {isAuthReady && isAuthenticated && !isFollowing && (
            <FollowPromptBanner
              isFollowing={isFollowing}
              targetUsername={targetUsername}
              targetDisplayName={targetDisplayName}
            />
          )}

          {/* フォーム（未ログイン時は共通LoginModalを開く導線） */}
          <CreateChallengeForm
            state={state}
            updateField={updateField}
            handleGoalTypeChange={handleGoalTypeChange}
            applyPreset={applyPreset}
            handleCreate={handleCreate}
            validationErrors={validationErrors}
            isPending={isPending}
            categoriesData={categoriesData}
            isCategoriesLoading={isCategoriesLoading}
            isDesktop={isDesktop}
            titleInputRef={refs.titleInputRef}
            dateInputRef={refs.dateInputRef}
            loginSectionRef={refs.loginSectionRef}
            onLoginOpen={tapLogin}
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* 認証UXモーダル（「Xでログインして作成」タップ時・他タブと同一UI） */}
      <LoginModal
        visible={authState.name === "confirm"}
        onConfirm={confirmYes}
        onCancel={confirmNo}
      />
      <RedirectingScreen visible={authState.name === "redirecting"} />
      <WaitingReturnScreen
        visible={authState.name === "waitingReturn"}
        remainingMs={authState.name === "waitingReturn" ? authState.timeoutMs - (Date.now() - authState.startedAt) : undefined}
      />
      {authState.name === "success" && (
        <SuccessScreen onClose={backWithoutLogin} />
      )}
      {authState.name === "cancel" && (
        <CancelScreen kind={authState.kind} onRetry={retry} onBack={backWithoutLogin} />
      )}
      {authState.name === "error" && (
        <ErrorScreen message={authState.message} onRetry={retry} onBack={backWithoutLogin} />
      )}

      {/* 作成完了モーダル */}
      {state.createdChallenge && (
        <ChallengeCreatedModal
          visible={state.showCreatedModal}
          onClose={handleCloseModal}
          challengeId={state.createdChallenge.id}
          challengeTitle={state.createdChallenge.title}
          eventDate={state.createdChallenge.eventDate}
          venue={state.createdChallenge.venue}
          goalValue={state.createdChallenge.goalValue}
          goalUnit={state.createdChallenge.goalUnit}
          hostName={state.createdChallenge.hostName}
        />
      )}
    </ScreenContainer>
  );
}
