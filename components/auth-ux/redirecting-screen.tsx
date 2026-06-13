/**
 * Phase 2: ログインUX改善
 * PR-2: Redirecting画面（X画面に遷移中）
 * 最小限の表示で遷移待ちのストレスを軽減
 * 12秒タイムアウトで閉じるボタンを表示
 */

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { color, palette } from "@/theme/tokens";

export interface RedirectingScreenProps {
  visible: boolean;
  /** タイムアウト時に閉じるボタンを押したときのコールバック */
  onDismiss?: () => void;
}

export function RedirectingScreen({ visible, onDismiss }: RedirectingScreenProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: palette.black + "99",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          backgroundColor: color.surface,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderRadius: 12,
          maxWidth: 280,
        }}
      >
        {timedOut && onDismiss ? (
          <>
            <Text style={{ color: color.textPrimary, fontSize: 14, textAlign: "center" }}>
              リダイレクトに時間がかかっています
            </Text>
            <Text style={{ color: color.textMuted, fontSize: 12, textAlign: "center" }}>
              ページをリロードして再度お試しください
            </Text>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                {
                  backgroundColor: color.accentPrimary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginTop: 4,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ color: color.textWhite, fontSize: 14, fontWeight: "600" }}>閉じる</Text>
            </Pressable>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <ActivityIndicator size="small" color={color.accentPrimary} />
            <Text style={{ color: color.textMuted, fontSize: 14 }}>X画面に移動中...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
