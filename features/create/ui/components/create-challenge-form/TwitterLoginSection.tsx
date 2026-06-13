// features/create/ui/components/create-challenge-form/TwitterLoginSection.tsx
// Twitterログインボタンセクション（未ログイン時バリデーションで吹き出し表示）

import { Text, Pressable, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { createFont } from "../../theme/tokens";
import { useColors } from "@/hooks/use-colors";
import type { TwitterLoginSectionProps } from "./types";
import { authCopy } from "@/constants/copy";
import { CharacterValidationError } from "@/components/molecules/character-validation-error";

/**
 * Twitterログインボタンセクション
 * 未ログイン時に表示されるログインボタン。バリデーションエラー時はキャラクター付き吹き出しを表示。
 */
export function TwitterLoginSection({ onLogin, showHostError, innerRef }: TwitterLoginSectionProps) {
  const colors = useColors();

  return (
    <View ref={innerRef} style={{ marginBottom: 16 }}>
      {/* バリデーションエラー時はキャラクター付きメッセージを表示（コンポーネント化・一貫性のため） */}
      {showHostError && (
        <CharacterValidationError
          errors={[{ field: "host" }]}
          visible={showHostError}
        />
      )}
      <Pressable
        onPress={onLogin}
        style={({ pressed }) => ({
          backgroundColor: color.twitter,
          borderRadius: 12,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <MaterialIcons name="login" size={20} color={color.textWhite} />
        <Text style={{ color: colors.foreground, fontSize: createFont.title, fontWeight: "bold", marginLeft: 8 }}>
          {authCopy.login.loginWithX}して作成
        </Text>
      </Pressable>
    </View>
  );
}
