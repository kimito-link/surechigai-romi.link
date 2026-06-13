import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
  // Profile (for 1-Click participation)
  prefecture?: string | null;
  gender?: "male" | "female" | "unspecified" | null;
  // Twitter/X specific fields (プロフィール情報のみ、トークンは含まない)
  username?: string;
  profileImage?: string;
  followersCount?: number;
  description?: string; // Twitter bio/自己紹介
  twitterId?: string;
  // Follow status for premium features
  isFollowingTarget?: boolean;
  targetAccount?: {
    id: string;
    name: string;
    username: string;
  };
  // Admin role
  role?: "user" | "admin";
};

export async function getSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      // Web: localStorageからセッショントークンを取得
      // クロスオリジン（Vercel→Railway）ではCookieが届かないため、
      // Bearer tokenによる認証が必要
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem(SESSION_TOKEN_KEY);
        return token;
      }
      return null;
    }

    // Use SecureStore for native
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SESSION_TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Failed to set session token:", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Web: localStorageからセッショントークンを削除
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_TOKEN_KEY);
      }
      return;
    }

    // Use SecureStore for native
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error("[Auth] Failed to remove session token:", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    let info: string | null = null;
    if (Platform.OS === "web") {
      info = window.localStorage.getItem(USER_INFO_KEY);
    } else {
      info = await SecureStore.getItemAsync(USER_INFO_KEY);
    }
    if (!info) return null;
    return JSON.parse(info);
  } catch (error) {
    console.error("[Auth] Failed to get user info:", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    // 既存ユーザー情報とマージ（Twitter固有フィールドを保持）
    const existingUser = await getUserInfo();
    const mergedUser: User = existingUser ? {
      ...existingUser,
      ...user,
      prefecture: user.prefecture ?? existingUser.prefecture,
      gender: user.gender ?? existingUser.gender,
      description: user.description ?? existingUser.description,
      username: user.username ?? existingUser.username,
      profileImage: user.profileImage ?? existingUser.profileImage,
      followersCount: user.followersCount ?? existingUser.followersCount,
      twitterId: user.twitterId ?? existingUser.twitterId,
      isFollowingTarget: user.isFollowingTarget ?? existingUser.isFollowingTarget,
      targetAccount: user.targetAccount ?? existingUser.targetAccount,
    } : user;

    const serialized = JSON.stringify(mergedUser);
    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, serialized);
    } else {
      await SecureStore.setItemAsync(USER_INFO_KEY, serialized);
    }
  } catch (error) {
    console.error("[Auth] Failed to set user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Use localStorage for web
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }

    // Use SecureStore for native
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear user info:", error);
  }
}
