/**
 * LoginHeader Component
 * ロゴ、キャッチコピー、3キャラクターアイコン
 */

import { Text } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";
import { mypageText, mypageFont } from "../../ui/theme/tokens";
import { logoImage } from "./constants";
import { CharacterIconRow } from "./CharacterIconRow";

export function LoginHeader() {
  const colors = useColors();

  return (
    <>
      {/* ロゴとキャッチコピー */}
      <Image 
        source={logoImage} 
        style={{ 
          width: 80, 
          height: 80,
          borderRadius: 40,
          marginBottom: 16,
        }} 
        contentFit="contain" 
      />
      <Text style={{ 
        color: colors.foreground, 
fontSize: mypageFont.lg,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
      }}>
        動員ちゃれんじ
      </Text>
      <Text style={{ 
        color: mypageText.muted, 
        fontSize: mypageFont.body,
        marginBottom: 24,
        textAlign: "center",
      }}>
        推しと繋がる、みんなで応援する
      </Text>

      {/* 3つのキャラクターアイコン */}
      <CharacterIconRow />
    </>
  );
}
