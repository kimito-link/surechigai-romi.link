/**
 * 自動ログインフック（BFFパターン対応）
 * 
 * BFF: トークンはサーバー側で管理されるため、
 * クライアントはキャッシュされたユーザー情報とセッションCookieのみで判定
 */

import { useEffect, useState, useCallback } from "react";
import * as Auth from "@/lib/_core/auth";
import { clearAllTokenData } from "@/lib/token-manager";

export interface AutoLoginState {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: Auth.User | null;
  error: Error | null;
}

export function useAutoLogin() {
  const [state, setState] = useState<AutoLoginState>({
    isLoading: true,
    isLoggedIn: false,
    user: null,
    error: null,
  });

  const checkAndRestoreSession = useCallback(async () => {
    try {
      // BFF: キャッシュされたユーザー情報を確認
      const cachedUser = await Auth.getUserInfo();
      
      if (!cachedUser) {
        setState({ isLoading: false, isLoggedIn: false, user: null, error: null });
        return;
      }

      // BFF: セッションCookieが有効ならログイン済みとみなす
      // トークンのリフレッシュはサーバーが自動で行う
      setState({ isLoading: false, isLoggedIn: true, user: cachedUser, error: null });
    } catch (error) {
      setState({
        isLoading: false,
        isLoggedIn: false,
        user: null,
        error: error instanceof Error ? error : new Error("ログイン状態の確認に失敗しました"),
      });
    }
  }, []);

  useEffect(() => {
    checkAndRestoreSession();
  }, [checkAndRestoreSession]);

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await checkAndRestoreSession();
  }, [checkAndRestoreSession]);

  const logout = useCallback(async () => {
    await clearAllTokenData();
    await Auth.clearUserInfo();
    setState({ isLoading: false, isLoggedIn: false, user: null, error: null });
  }, []);

  return { ...state, refreshSession, logout };
}
