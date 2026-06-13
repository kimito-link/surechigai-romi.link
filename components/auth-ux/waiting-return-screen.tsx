/**
 * Phase 2: ログインUX改善
 * PR-3: WaitingReturn画面（X画面から戻ってくるのを待つ）
 */

import { View, Text, ActivityIndicator } from "react-native";
import { color, palette } from "@/theme/tokens";
import { LinkSpeech } from "./link-speech";
import { useEffect, useState } from "react";

export interface WaitingReturnScreenProps {
  /**
   * 表示するかどうか
   */
  visible: boolean;
  /**
   * タイムアウトまでの残り時間（ミリ秒）
   */
  remainingMs?: number;
}

/**
 * WaitingReturn画面
 * 
 * X画面から戻ってくるのを待つ画面
 * りんくの吹き出しで「もう少しだよ！」と説明
 * タイムアウトまでの残り時間を表示
 */
export function WaitingReturnScreen({ visible, remainingMs }: WaitingReturnScreenProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    remainingMs ? Math.ceil(remainingMs / 1000) : 30
  );

  // 残り時間のカウントダウン
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
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
        backgroundColor: palette.black + "CC",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: 16,
          padding: 24,
          maxWidth: 320,
          width: "90%",
          alignItems: "center",
        }}
      >
        {/* りんくの吹き出し */}
        <LinkSpeech
          title="りんく"
          message="もう少しだよ！Xでの操作が終わったら、このアプリに戻ってきてね。"
        />

        {/* ローディングインジケーター */}
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color={color.accentPrimary} />
          <Text
            style={{
              color: color.textMuted,
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            ログイン処理中...
          </Text>
          
          {/* 残り時間表示 */}
          {remainingSeconds > 0 && (
            <Text
              style={{
                color: color.textSecondary,
                fontSize: 12,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              残り {remainingSeconds} 秒
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
