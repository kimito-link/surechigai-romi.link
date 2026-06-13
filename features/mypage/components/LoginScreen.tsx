/**
 * ログイン画面コンポーネント
 * 未ログイン状態のマイページUI
 */
import { View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
import { mypageGradient } from "../ui/theme/tokens";
import {
  LoginHeader,
  LoginMessageCard,
  CharacterBubble,
  PatternSelector,
  loginPatterns,
  getRandomPattern,
  type LoginPattern,
} from "./login-screen";

// 後方互換性のためにエクスポート
export { loginPatterns, getRandomPattern };

interface LoginScreenProps {
  isLoggingIn: boolean;
  loginPattern: LoginPattern;
  onLogin: () => void;
  onPatternChange: (pattern: LoginPattern) => void;
}

export function LoginScreen({
  isLoggingIn,
  loginPattern,
  onLogin,
  onPatternChange,
}: LoginScreenProps) {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* グラデーション背景 */}
      <LinearGradient
        colors={[...mypageGradient.loginBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1, 
          alignItems: "center", 
          padding: 24,
          paddingBottom: 48,
        }}
      >
        {/* ロゴとキャラクターアイコン */}
        <LoginHeader />

        {/* メインメッセージカード */}
        <LoginMessageCard 
          pattern={loginPattern} 
          isLoggingIn={isLoggingIn} 
          onLogin={onLogin} 
        />

        {/* ログインボタンは削除し、メインメッセージカード内のボタンを使用 */}

        {/* キャラクターの吹き出しメッセージ */}
        <CharacterBubble pattern={loginPattern} />

        {/* パターン切り替え */}
        <PatternSelector 
          currentPattern={loginPattern} 
          onPatternChange={onPatternChange} 
        />
      </ScrollView>
    </View>
  );
}
