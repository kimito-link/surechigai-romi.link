/**
 * Admin Session Management
 * 管理者セッション管理（パスワード認証用）
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_MAX_AGE_MS } from "@/shared/const";

const ADMIN_SESSION_KEY = "admin_session";
// 72時間有効（堅牢設計ガイドに基づき短縮）
const ADMIN_SESSION_EXPIRY = SESSION_MAX_AGE_MS;

/**
 * 管理者セッションを保存
 */
export async function setAdminSession(): Promise<void> {
  try {
    const expiry = Date.now() + ADMIN_SESSION_EXPIRY;
    const sessionData = JSON.stringify({ authenticated: true, expiry });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_SESSION_KEY, sessionData);
    } else {
      await SecureStore.setItemAsync(ADMIN_SESSION_KEY, sessionData);
    }
  } catch (error) {
    console.error("[AdminSession] Failed to set admin session:", error);
    throw error;
  }
}

/**
 * 管理者セッションを取得
 */
export async function getAdminSession(): Promise<boolean> {
  try {
    let sessionData: string | null = null;

    if (Platform.OS === "web") {
      // Web環境: windowが存在することを確認
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          sessionData = window.localStorage.getItem(ADMIN_SESSION_KEY);
        } catch (storageError) {
          console.warn("[AdminSession] localStorage access failed:", storageError);
          return false;
        }
      } else {
        console.warn("[AdminSession] window or localStorage not available");
        return false;
      }
    } else {
      // Native環境
      sessionData = await SecureStore.getItemAsync(ADMIN_SESSION_KEY);
    }

    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    
    // 有効期限チェック
    if (session.expiry && Date.now() > session.expiry) {
      await clearAdminSession();
      return false;
    }

    return session.authenticated === true;
  } catch (error) {
    console.error("[AdminSession] Failed to get admin session:", error);
    return false;
  }
}

/**
 * 管理者セッションをクリア
 */
export async function clearAdminSession(): Promise<void> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(ADMIN_SESSION_KEY);
    }
  } catch (error) {
    console.error("[AdminSession] Failed to clear admin session:", error);
  }
}
