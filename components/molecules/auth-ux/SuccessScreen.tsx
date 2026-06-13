/**
 * Phase 2: ログインUX改善
 * PR-4: success状態の画面コンポーネント
 * 
 * ログイン成功時に表示される画面
 * 短時間（800ms）で自動的にcloseする
 */

import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { color } from "@/theme/tokens";

const rinkuImage = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

export interface SuccessScreenProps {
  onClose: () => void;
}

export function SuccessScreen({ onClose }: SuccessScreenProps) {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);

  // 800ms後に自動でclose
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 800);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* りんくキャラクター */}
      {!imageError ? (
        <Image
          source={rinkuImage}
          style={{ width: 120, height: 120, marginBottom: 24 }}
          contentFit="contain"
          onError={() => setImageError(true)}
          cachePolicy="memory-disk"
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            marginBottom: 24,
            borderRadius: 60,
            backgroundColor: color.accentPrimary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 48, fontWeight: "bold" }}>り</Text>
        </View>
      )}

      {/* 成功メッセージ */}
      <View
        style={{
          backgroundColor: `${colors.primary}10`,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          maxWidth: 400,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          ログイン完了！
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          ようこそ！動員ちゃれんじを始めましょう
        </Text>
      </View>
    </View>
  );
}
