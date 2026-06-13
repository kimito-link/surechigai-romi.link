import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import { apiPost, apiGet } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // 全プラットフォームでBearerトークンを送信
  // Web: localStorageから取得（クロスオリジンではCookieが届かないため必須）
  // Native: SecureStoreから取得
  const authToken = await getAuthToken();
  if (authToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        // JSON以外はそのまま使用
      }
      throw new Error(errorMessage || `API error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown API error");
  }
}

// Logout - BFFパターン: サーバーが自動でトークンリボーク+削除
export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", {
    method: "POST",
  });
}

// Get current authenticated user (web uses cookie-based auth)
export async function getMe(): Promise<{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
  prefecture?: string | null;
  gender?: "male" | "female" | "unspecified" | null;
  role?: "user" | "admin" | null;
} | null> {
  try {
    const result = await apiCall<{ user: any }>("/api/auth/me");
    return result.user || null;
  } catch (error) {
    console.error("[API] getMe failed:", error);
    return null;
  }
}

// Get Twitter profile (profileImage, username, description, followersCount) for display in create form etc.
export async function getTwitterProfile(): Promise<{
  twitterId?: string;
  name?: string;
  username?: string;
  profileImage?: string;
  followersCount?: number;
  description?: string;
} | null> {
  try {
    const result = await apiCall<{
      twitterId?: string;
      name?: string;
      username?: string;
      profileImage?: string;
      followersCount?: number;
      description?: string;
    }>("/api/twitter/me");
    return result || null;
  } catch (error) {
    console.error("[API] getTwitterProfile failed:", error);
    return null;
  }
}

// Establish session cookie on the backend (3000-xxx domain)
// Called after receiving token via postMessage to get a proper Set-Cookie from the backend
export async function establishSession(token: string): Promise<boolean> {
  try {
    console.log("[API] establishSession: setting cookie on backend...");
    
    const result = await apiPost("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!result.ok) {
      console.error("[API] establishSession failed:", result.status, result.error);
      return false;
    }

    console.log("[API] establishSession: cookie set successfully");
    return true;
  } catch (error) {
    console.error("[API] establishSession error:", error);
    return false;
  }
}


// Check Twitter follow status (BFFパターン: サーバーが保管トークンを使用)
export async function checkFollowStatus(
  userId: string
): Promise<{
  isFollowing: boolean;
  targetAccount: {
    id: string;
    name: string;
    username: string;
  } | null;
}> {
  try {
    // セッションCookie/Bearerトークンで認証、サーバーがTwitterトークンを使用
    const result = await apiGet<{
      isFollowing: boolean;
      targetAccount: {
        id: string;
        name: string;
        username: string;
      } | null;
    }>(`/api/twitter/follow-status?userId=${encodeURIComponent(userId)}`);

    if (!result.ok || !result.data) {
      return { isFollowing: false, targetAccount: null };
    }

    return {
      isFollowing: result.data.isFollowing || false,
      targetAccount: result.data.targetAccount || null,
    };
  } catch (error) {
    console.error("[API] checkFollowStatus error:", error instanceof Error ? error.message : "unknown");
    return { isFollowing: false, targetAccount: null };
  }
}
