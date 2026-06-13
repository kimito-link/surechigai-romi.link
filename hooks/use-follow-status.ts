import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import * as Auth from "@/lib/_core/auth";
import * as Api from "@/lib/_core/api";

const FOLLOW_STATUS_KEY = "twitter_follow_status";
const TARGET_USERNAME = "idolfunch";
const TARGET_DISPLAY_NAME = "君斗りんく";
const FOLLOW_STATUS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間

interface FollowStatusData {
  isFollowing: boolean;
  targetUsername: string;
  targetDisplayName: string;
  targetTwitterId?: string;
  lastCheckedAt?: string;
}

/**
 * Twitterフォロー状態を管理するカスタムフック
 * ログイン後に非同期でフォローステータスを確認する
 */
export function useFollowStatus() {
  const [followStatus, setFollowStatus] = useState<FollowStatusData>({
    isFollowing: false,
    targetUsername: TARGET_USERNAME,
    targetDisplayName: TARGET_DISPLAY_NAME,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);
  const appState = useRef(AppState.currentState);
  const hasCheckedAfterLogin = useRef(false);

  // ローカルストレージからフォロー状態を読み込む（24時間のTTLチェック）
  const loadFollowStatus = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FOLLOW_STATUS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as FollowStatusData & { cachedAt?: string };
        
        // キャッシュの有効期限をチェック（24時間）
        if (data.lastCheckedAt) {
          const lastChecked = new Date(data.lastCheckedAt).getTime();
          const now = Date.now();
          const age = now - lastChecked;
          
          if (age > FOLLOW_STATUS_CACHE_TTL) {
            console.log("[useFollowStatus] Cache expired, clearing...");
            await AsyncStorage.removeItem(FOLLOW_STATUS_KEY);
            return null;
          }
        }
        
        setFollowStatus(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error("[useFollowStatus] Failed to load follow status:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // フォロー状態を保存する
  const saveFollowStatus = useCallback(async (data: FollowStatusData) => {
    try {
      await AsyncStorage.setItem(FOLLOW_STATUS_KEY, JSON.stringify(data));
      setFollowStatus(data);
    } catch (error) {
      console.error("[useFollowStatus] Failed to save follow status:", error);
    }
  }, []);

  // フォロー状態を更新する（ログイン時にサーバーから取得した情報で更新）
  const updateFollowStatus = useCallback(
    async (isFollowing: boolean, targetUser?: { id: string; name: string; username: string }) => {
      const data: FollowStatusData = {
        isFollowing,
        targetUsername: targetUser?.username || TARGET_USERNAME,
        targetDisplayName: targetUser?.name || TARGET_DISPLAY_NAME,
        targetTwitterId: targetUser?.id,
        lastCheckedAt: new Date().toISOString(),
      };
      await saveFollowStatus(data);
      
      // ユーザー情報も更新
      const userInfo = await Auth.getUserInfo();
      if (userInfo) {
        await Auth.setUserInfo({
          ...userInfo,
          isFollowingTarget: isFollowing,
          targetAccount: targetUser,
        });
      }
    },
    [saveFollowStatus]
  );

  // サーバーからフォロー状態を非同期で確認する（ログイン後に呼び出す）
  const checkFollowStatusFromServer = useCallback(async () => {
    if (checkingFollowStatus) {
      console.log("[useFollowStatus] Already checking follow status, skipping...");
      return false;
    }

    setCheckingFollowStatus(true);
    try {
      console.log("[useFollowStatus] Checking follow status from server...");
      
      // ユーザー情報を取得
      const userInfo = await Auth.getUserInfo();
      if (!userInfo) {
        console.log("[useFollowStatus] No user info, cannot check follow status");
        return false;
      }

      // BFFパターン: トークンはサーバーで管理、twitterIdのみ必要
      const twitterId = userInfo.twitterId;

      if (!twitterId) {
        console.log("[useFollowStatus] No Twitter ID, cannot check follow status");
        return false;
      }

      // APIを呼び出してフォローステータスを確認（サーバーが保管トークンを使用）
      const result = await Api.checkFollowStatus(twitterId);
      
      if (result.isFollowing !== undefined) {
        const data: FollowStatusData = {
          isFollowing: result.isFollowing,
          targetUsername: result.targetAccount?.username || TARGET_USERNAME,
          targetDisplayName: result.targetAccount?.name || TARGET_DISPLAY_NAME,
          targetTwitterId: result.targetAccount?.id,
          lastCheckedAt: new Date().toISOString(),
        };
        await saveFollowStatus(data);
        
        // ユーザー情報も更新
        await Auth.setUserInfo({
          ...userInfo,
          isFollowingTarget: result.isFollowing,
          targetAccount: result.targetAccount || undefined,
        });
        
        console.log("[useFollowStatus] Follow status checked:", result.isFollowing);
        return result.isFollowing;
      }
      
      return false;
    } catch (error) {
      console.error("[useFollowStatus] Failed to check follow status:", error);
      return false;
    } finally {
      setCheckingFollowStatus(false);
    }
  }, [checkingFollowStatus, saveFollowStatus]);

  // サーバーからフォロー状態を再確認する（再ログインを促す）
  const refreshFollowStatusFromServer = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("[useFollowStatus] Refreshing follow status from server...");
      
      // ユーザー情報を取得
      const userInfo = await Auth.getUserInfo();
      if (!userInfo) {
        console.log("[useFollowStatus] No user info, cannot refresh");
        return false;
      }

      // ユーザー情報にisFollowingTargetがあればそれを使用
      if (userInfo.isFollowingTarget !== undefined) {
        const data: FollowStatusData = {
          isFollowing: userInfo.isFollowingTarget,
          targetUsername: userInfo.targetAccount?.username || TARGET_USERNAME,
          targetDisplayName: userInfo.targetAccount?.name || TARGET_DISPLAY_NAME,
          targetTwitterId: userInfo.targetAccount?.id,
          lastCheckedAt: new Date().toISOString(),
        };
        await saveFollowStatus(data);
        console.log("[useFollowStatus] Follow status refreshed:", data.isFollowing);
        return data.isFollowing;
      }
      
      // ユーザー情報にフォローステータスがない場合は、サーバーから確認
      return await checkFollowStatusFromServer();
    } catch (error) {
      console.error("[useFollowStatus] Failed to refresh follow status:", error);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [saveFollowStatus, checkFollowStatusFromServer]);

  // フォロー状態をクリアする（ログアウト時）
  const clearFollowStatus = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FOLLOW_STATUS_KEY);
      setFollowStatus({
        isFollowing: false,
        targetUsername: TARGET_USERNAME,
        targetDisplayName: TARGET_DISPLAY_NAME,
      });
      hasCheckedAfterLogin.current = false;
    } catch (error) {
      console.error("[useFollowStatus] Failed to clear follow status:", error);
    }
  }, []);

  // アプリがフォアグラウンドに戻ったときにフォロー状態を再確認
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("[useFollowStatus] App came to foreground, checking follow status...");
        // フォアグラウンドに戻ったときに再確認
        await refreshFollowStatusFromServer();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshFollowStatusFromServer]);

  // 初期読み込み
  useEffect(() => {
    loadFollowStatus();
  }, [loadFollowStatus]);

  return {
    ...followStatus,
    loading,
    refreshing,
    checkingFollowStatus,
    updateFollowStatus,
    clearFollowStatus,
    refresh: loadFollowStatus,
    refreshFromServer: refreshFollowStatusFromServer,
    checkFollowStatusFromServer,
  };
}

// Re-export premium features for backward compatibility
export { PREMIUM_FEATURES, isPremiumFeature } from "@/lib/premium-features";
