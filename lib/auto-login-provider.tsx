/**
 * 自動ログインプロバイダー（BFFパターン対応）
 * 
 * BFF: トークンはサーバー側で管理されるため、
 * クライアントはキャッシュされたユーザー情報とセッションCookieのみで判定。
 * バックグラウンドリフレッシュもサーバーが自動で行う。
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import * as Auth from "@/lib/_core/auth";

interface AutoLoginContextType {
  isInitialized: boolean;
  isRestoring: boolean;
  restorationError: Error | null;
  refreshSession: () => Promise<void>;
}

const AutoLoginContext = createContext<AutoLoginContextType>({
  isInitialized: false,
  isRestoring: true,
  restorationError: null,
  refreshSession: async () => {},
});

export function useAutoLoginContext() {
  return useContext(AutoLoginContext);
}

interface AutoLoginProviderProps {
  children: ReactNode;
}

export function AutoLoginProvider({ children }: AutoLoginProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restorationError, setRestorationError] = useState<Error | null>(null);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setRestorationError(null);

    try {
      // BFF: キャッシュされたユーザー情報を確認するだけ
      // トークン管理はすべてサーバーが行う
      const cachedUser = await Auth.getUserInfo();
      
      if (!cachedUser) {
        setIsInitialized(true);
        setIsRestoring(false);
        return;
      }

      // セッションCookieが有効なら復元完了
      setIsInitialized(true);
      setIsRestoring(false);
    } catch (error) {
      setRestorationError(error instanceof Error ? error : new Error("セッション復元エラー"));
      setIsInitialized(true);
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const refreshSession = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  return (
    <AutoLoginContext.Provider
      value={{
        isInitialized,
        isRestoring,
        restorationError,
        refreshSession,
      }}
    >
      {children}
    </AutoLoginContext.Provider>
  );
}
