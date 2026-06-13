import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

const LOGIN_SUCCESS_KEY = "login_success_pending";

interface LoginSuccessContextType {
  showLoginSuccess: boolean;
  userName: string | null;
  userProfileImage: string | null;
  triggerLoginSuccess: (name?: string, profileImage?: string) => void;
  dismissLoginSuccess: () => void;
}

const LoginSuccessContext = createContext<LoginSuccessContextType | null>(null);

export function LoginSuccessProvider({ children }: { children: ReactNode }) {
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  // 起動時にペンディングのログイン成功があるか確認
  useEffect(() => {
    const checkPendingLoginSuccess = async () => {
      try {
        const pending = await AsyncStorage.getItem(LOGIN_SUCCESS_KEY);
        if (pending) {
          const data = JSON.parse(pending);
          setUserName(data.name || null);
          setUserProfileImage(data.profileImage || null);
          setShowLoginSuccess(true);
          await AsyncStorage.removeItem(LOGIN_SUCCESS_KEY);
        }
      } catch (err) {
        console.error("[LoginSuccess] Failed to check pending:", err);
      }
    };
    checkPendingLoginSuccess();
  }, []);

  const triggerLoginSuccess = useCallback(async (name?: string, profileImage?: string) => {
    setUserName(name || null);
    setUserProfileImage(profileImage || null);
    setShowLoginSuccess(true);
  }, []);

  const dismissLoginSuccess = useCallback(() => {
    setShowLoginSuccess(false);
    setUserName(null);
    setUserProfileImage(null);
  }, []);

  return (
    <LoginSuccessContext.Provider
      value={{
        showLoginSuccess,
        userName,
        userProfileImage,
        triggerLoginSuccess,
        dismissLoginSuccess,
      }}
    >
      {children}
    </LoginSuccessContext.Provider>
  );
}

export function useLoginSuccess() {
  const context = useContext(LoginSuccessContext);
  if (!context) {
    throw new Error("useLoginSuccess must be used within LoginSuccessProvider");
  }
  return context;
}

// OAuthコールバックからログイン成功を保存する関数
export async function saveLoginSuccessPending(name?: string, profileImage?: string) {
  try {
    await AsyncStorage.setItem(
      LOGIN_SUCCESS_KEY,
      JSON.stringify({ name, profileImage })
    );
  } catch (err) {
    console.error("[LoginSuccess] Failed to save pending:", err);
  }
}
