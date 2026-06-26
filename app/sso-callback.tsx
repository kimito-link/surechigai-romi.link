/**
 * SSO コールバック画面
 * Clerk の authenticateWithRedirect からリダイレクトされた後、
 * handleRedirectCallback を呼んでセッションを確立し、
 * 最終的な遷移先（redirectUrlComplete）へ転送する。
 */

import { getClerkInstance } from "@clerk/expo";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { color } from "@/theme/tokens";

export default function SSOCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Clerk がまだロードされていない場合は待機する
    const tryHandle = async (retries = 15) => {
      for (let i = 0; i < retries; i++) {
        try {
          const clerkInstance = typeof window !== "undefined" && (window as any).Clerk ? (window as any).Clerk : getClerkInstance();
          if (clerkInstance && clerkInstance.client) {
            await clerkInstance.handleRedirectCallback({});
            return; // Clerk が最終URLへリダイレクトしてくれる
          }
        } catch (err) {
          console.warn("[SSOCallback] handleRedirectCallback attempt failed:", err);
        }
        // 500ms 待ってリトライ
        await new Promise((r) => setTimeout(r, 500));
      }
      setError("認証の完了に失敗しました。ページをリロードしてください。");
    };

    tryHandle();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: color.bg,
      }}
    >
      {error ? (
        <>
          <Text style={{ color: color.danger, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
            {error}
          </Text>
          <Text
            style={{ color: color.accentPrimary, fontSize: 14, textDecorationLine: "underline" }}
            onPress={() => {
              if (typeof window !== "undefined") window.location.href = "/";
            }}
          >
            ホームに戻る
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text style={{ marginTop: 16, color: color.textPrimary, fontSize: 16 }}>
            認証を完了しています...
          </Text>
        </>
      )}
    </View>
  );
}
