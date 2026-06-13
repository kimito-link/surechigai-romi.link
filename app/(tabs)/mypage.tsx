/**
 * マイページ画面
 * ユーザープロフィール、参加履歴、設定を表示
 */

import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useResponsive } from "@/hooks/use-responsive";
import { useColors } from "@/hooks/use-colors";
import { AppHeader } from "@/components/organisms/app-header";
import { LogoutConfirmModal } from "@/components/molecules/logout-confirm-modal";
import { LoginModal } from "@/components/common/LoginModal";
import { MypageSkeleton } from "@/components/organisms/mypage-skeleton";
import { AccountSwitcher } from "@/components/organisms/account-switcher";
import { 
  LoginScreen, 
  AuthenticatedContent,
  useMypageData,
  useMypageActions,
} from "@/features/mypage";

export default function MyPageScreen() {
  const colors = useColors();
  const { isDesktop } = useResponsive();
  
  // データ取得フック
  const mypageData = useMypageData();
  
  // アクションフック
  const mypageActions = useMypageActions({
    user: mypageData.user,
    isAuthenticated: mypageData.isAuthenticated,
    login: mypageData.login,
  });

  // ローディング中
  if (mypageData.loading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <AppHeader 
          title="君斗りんくの動員ちゃれんじ" 
          showCharacters={false}
          isDesktop={isDesktop}
          showMenu={true}
        />
        <MypageSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* ヘッダー */}
      <AppHeader 
        title="君斗りんくの動員ちゃれんじ" 
        showCharacters={false}
        isDesktop={isDesktop}
        showMenu={true}
      />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>
          マイページ
        </Text>
      </View>

      {!mypageData.isAuthenticated ? (
        // 未ログイン状態
        <LoginScreen
          isLoggingIn={mypageActions.isLoggingIn}
          loginPattern={mypageActions.loginPattern}
          onLogin={mypageActions.handleLogin}
          onPatternChange={mypageActions.setLoginPattern}
        />
      ) : (
        // ログイン済み状態
        <AuthenticatedContent
          user={mypageData.user}
          totalContribution={mypageData.totalContribution}
          participationsCount={mypageData.myParticipations?.length || 0}
          challengesCount={mypageData.myChallenges?.length || 0}
          invitationStats={mypageData.invitationStats}
          isFollowing={mypageActions.isFollowing}
          targetUsername={mypageActions.targetUsername}
          targetDisplayName={mypageActions.targetDisplayName}
          refreshing={mypageActions.refreshing}
          onRelogin={mypageData.login}
          onRefreshFollowStatus={mypageActions.handleRefreshFollowStatus}
          myBadges={mypageData.myBadges}
          myParticipations={mypageData.myParticipations}
          myChallenges={mypageData.myChallenges}
          onAccountSwitch={() => mypageActions.setShowAccountSwitcher(true)}
          onLogout={mypageActions.handleLogout}
          onChallengePress={mypageActions.handleChallengePress}
          onNavigateToAchievements={mypageActions.navigateToAchievements}
          onNavigateToNotificationSettings={mypageActions.navigateToNotificationSettings}
          onNavigateToApiUsage={mypageActions.navigateToApiUsage}
        />
      )}

      {/* ログイン確認モーダル */}
      <LoginModal
        visible={mypageActions.showLoginConfirmModal}
        onConfirm={mypageActions.handleLoginConfirm}
        onCancel={mypageActions.handleLoginCancel}
      />

      {/* ログアウト確認モーダル */}
      <LogoutConfirmModal
        visible={mypageActions.showLogoutModal}
        onCancel={() => mypageActions.setShowLogoutModal(false)}
        onConfirm={mypageActions.confirmLogout}
      />

      {/* アカウント切り替えモーダル */}
      <AccountSwitcher
        visible={mypageActions.showAccountSwitcher}
        onClose={() => mypageActions.setShowAccountSwitcher(false)}
      />
    </ScreenContainer>
  );
}
