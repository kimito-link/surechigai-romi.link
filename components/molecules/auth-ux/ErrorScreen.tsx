/**
 * Phase 2: ログインUX改善
 * PR-6: error状態の画面コンポーネント
 * 
 * ログインエラー時に表示される画面
 * retry/back導線を提供
 */

import { View, Text } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";
import { Button } from "@/components/ui/button";
import { color } from "@/theme/tokens";

const rinkuImage = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

export interface ErrorScreenProps {
  message?: string;
  onRetry: () => void;
  onBack: () => void;
}

export function ErrorScreen({ message, onRetry, onBack }: ErrorScreenProps) {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);

  const displayMessage = message || "ログイン中にエラーが発生しました。もう一度お試しください。";

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

      {/* エラーメッセージ */}
      <View
        style={{
          backgroundColor: `${colors.error}10`,
          borderLeftWidth: 3,
          borderLeftColor: colors.error,
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
          ログインエラー
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {displayMessage}
        </Text>
      </View>

      {/* ボタン */}
      <View style={{ width: "100%", maxWidth: 400, gap: 12 }}>
        <Button variant="primary" onPress={onRetry}>
          もう一度ログイン
        </Button>
        <Button variant="outline" onPress={onBack}>
          ログインせず戻る
        </Button>
      </View>
    </View>
  );
}
