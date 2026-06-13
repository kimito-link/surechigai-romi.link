/**
 * useMypageActions Hook
 * マイページのアクション（ナビゲーション、ログイン/ログアウト等）
 * v6.38: navigateに移行
 */

import { useState, useEffect, useRef } from "react";
import { navigate } from "@/lib/navigation";
import { useFollowStatus } from "@/hooks/use-follow-status";
import { getRandomPattern, loginPatterns } from "../components/LoginScreen";

interface UseMypageActionsOptions {
  user: any;
  isAuthenticated: boolean;
  login: () => Promise<void>;
}

interface UseMypageActionsReturn {
  // Login
  isLoggingIn: boolean;
  loginPattern: any;
  handleLogin: () => void;
  handleLoginConfirm: () => Promise<void>;
  handleLoginCancel: () => void;
  showLoginConfirmModal: boolean;
  setLoginPattern: (pattern: any) => void;
  
  // Logout
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
  handleLogout: () => void;
  confirmLogout: () => void;
  
  // Account Switcher
  showAccountSwitcher: boolean;
  setShowAccountSwitcher: (show: boolean) => void;
  
  // Follow Status
  isFollowing: boolean | undefined;
  targetUsername: string;
  targetDisplayName: string;
  refreshing: boolean;
  handleRefreshFollowStatus: () => Promise<void>;
  
  // Navigation
  handleChallengePress: (challengeId: number) => void;
  navigateToAchievements: () => void;
  navigateToNotificationSettings: () => void;
  navigateToApiUsage: () => void;
}

export function useMypageActions({
  user,
  isAuthenticated,
  login,
}: UseMypageActionsOptions): UseMypageActionsReturn {
  const { 
    isFollowing, 
    targetUsername, 
    targetDisplayName, 
    updateFollowStatus, 
    refreshFromServer, 
    refreshing
  } = useFollowStatus();

  // フォロー状態を再確認（再認証なし）
  const handleRefreshFollowStatus = async () => {
    console.log("[MyPage] Refreshing follow status without re-auth...");
    await refreshFromServer();
  };
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginPattern, setLoginPattern] = useState(() => {
    if (typeof window !== "undefined") {
      const storedId = window.localStorage?.getItem("e2e_login_pattern_id");
      const parsedId = storedId ? Number(storedId) : NaN;
      if (!Number.isNaN(parsedId)) {
        const pattern = loginPatterns.find((item) => item.id === parsedId);
        if (pattern) {
          return pattern;
        }
      }
    }
    return getRandomPattern();
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showLoginConfirmModal, setShowLoginConfirmModal] = useState(false);

  // ログイン時にフォロー状態を更新
  useEffect(() => {
    if (user?.isFollowingTarget !== undefined) {
      updateFollowStatus(user.isFollowingTarget, user.targetAccount);
    }
  }, [user?.isFollowingTarget, user?.targetAccount, updateFollowStatus]);

  // ログイン後に非同期でフォローステータスを確認
  const hasCheckedFollowStatus = useRef(false);
  useEffect(() => {
    if (hasCheckedFollowStatus.current) {
      return;
    }
    if (isAuthenticated && user && user.isFollowingTarget === undefined) {
      console.log("[MyPage] Checking follow status in background (once)...");
      hasCheckedFollowStatus.current = true;
      refreshFromServer();
    }
  }, [isAuthenticated, user, refreshFromServer]);

  const handleLoginButtonPress = () => {
    setShowLoginConfirmModal(true);
  };

  const handleLoginConfirm = async () => {
    setShowLoginConfirmModal(false);
    setIsLoggingIn(true);
    try {
      await login();
    } finally {
      setTimeout(() => setIsLoggingIn(false), 3000);
    }
  };

  const handleLoginCancel = () => {
    setShowLoginConfirmModal(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate.toLogout();
  };

  const handleChallengePress = (challengeId: number) => {
    navigate.toEventDetail(challengeId);
  };

  const navigateToAchievements = () => navigate.toAchievements();
  const navigateToNotificationSettings = () => navigate.toNotificationSettings();
  const navigateToApiUsage = () => navigate.toApiUsage();

  return {
    // Login
    isLoggingIn,
    loginPattern,
    handleLogin: handleLoginButtonPress,
    handleLoginConfirm,
    handleLoginCancel,
    showLoginConfirmModal,
    setLoginPattern,
    
    // Logout
    showLogoutModal,
    setShowLogoutModal,
    handleLogout,
    confirmLogout,
    
    // Account Switcher
    showAccountSwitcher,
    setShowAccountSwitcher,
    
    // Follow Status
    isFollowing,
    targetUsername,
    targetDisplayName,
    refreshing,
    handleRefreshFollowStatus,
    
    // Navigation
    handleChallengePress,
    navigateToAchievements,
    navigateToNotificationSettings,
    navigateToApiUsage,
  };
}
