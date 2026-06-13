/**
 * Phase 2: ログインUX改善
 * PR-1: LinkSpeechコンポーネント（りんくの吹き出し）
 * 
 * このファイルはPhase 2実装ガイドに基づいて作成されています。
 * docs/phase2-implementation-guide.md を参照してください。
 */

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { color, palette } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

export type LinkSpeechTone = "normal" | "warning";

export type LinkSpeechProps = {
  title?: string; // 例: "りんく"
  message: string; // 吹き出し本文（短い）
  tone?: LinkSpeechTone;
};

// りんくのキャラクター画像（他のコンポーネントと統一）
const RINKU_IMAGE = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

/**
 * りんくの吹き出しコンポーネント
 * 
 * ログイン確認モーダルなどで使用
 */
export function LinkSpeech({ title, message, tone = "normal" }: LinkSpeechProps) {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      {/* りんくのアイコン */}
      <View style={styles.iconContainer}>
        {!imageError ? (
          <Image
            source={RINKU_IMAGE}
            style={styles.icon}
            contentFit="contain"
            onError={() => setImageError(true)}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.icon, styles.fallbackIcon]}>
            <Text style={styles.fallbackText}>り</Text>
          </View>
        )}
      </View>

      {/* タイトル（オプション） */}
      {title && (
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      )}

      {/* 吹き出し */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: tone === "warning" ? palette.orange500 + "1A" : colors.surface,
            borderColor: tone === "warning" ? color.warning : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: tone === "warning" ? color.warning : colors.foreground,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.accentPrimary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 64,
    height: 64,
  },
  fallbackIcon: {
    backgroundColor: color.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
  },
  fallbackText: {
    color: palette.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
