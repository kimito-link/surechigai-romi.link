/**
 * LoginMessageCard Component
 * グラデーション背景のメインメッセージカード
 */

import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/ui/button";
import { color } from "@/theme/tokens";
import { mypageFont } from "../../ui/theme/tokens";
import type { LoginPattern } from "./constants";
import { authCopy, commonCopy } from "@/constants/copy";

interface LoginMessageCardProps {
  pattern: LoginPattern;
  isLoggingIn: boolean;
  onLogin: () => void;
}

export function LoginMessageCard({ pattern, isLoggingIn, onLogin }: LoginMessageCardProps) {
  return (
    <LinearGradient
      colors={[...pattern.gradientColors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        maxWidth: 400,
        width: "100%",
      }}
    >
      <Text style={{ 
        color: color.textWhite, 
        fontSize: mypageFont.lg,
        fontWeight: "bold",
        marginBottom: 12,
        textAlign: "center",
      }}>
        {pattern.title}
      </Text>
      <Text style={{ 
        color: color.textWhite + "E6", // rgba(255,255,255,0.9) の透明度16進数
        fontSize: mypageFont.body,
        lineHeight: 22,
        textAlign: "center",
        marginBottom: 16,
      }}>
        {pattern.message}
      </Text>
      <View style={{ 
        backgroundColor: color.textWhite + "33", // rgba(255,255,255,0.2) の透明度16進数
        borderRadius: 8, 
        padding: 12,
        marginBottom: 16,
      }}>
        <Text style={{ 
          color: color.textWhite, 
          fontSize: mypageFont.title,
          fontWeight: "bold",
          textAlign: "center",
        }}>
          {pattern.highlight}
        </Text>
      </View>
      <Button
        onPress={onLogin}
        disabled={isLoggingIn}
        loading={isLoggingIn}
        icon="login"
        style={{
          backgroundColor: color.twitter,
          width: "100%",
        }}
      >
        {isLoggingIn ? commonCopy.loading.loading : authCopy.login.loginWithX}
      </Button>
    </LinearGradient>
  );
}
