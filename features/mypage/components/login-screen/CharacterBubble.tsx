/**
 * CharacterBubble Component
 * キャラクターの吹き出しメッセージ
 */

import { View, Text } from "react-native";
import { Image } from "expo-image";
import { mypageText, mypageFont } from "../../ui/theme/tokens";
import { characterImages, type LoginPattern } from "./constants";

interface CharacterBubbleProps {
  pattern: LoginPattern;
}

export function CharacterBubble({ pattern }: CharacterBubbleProps) {
  return (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "flex-start", 
      marginTop: 24,
      maxWidth: 400,
      width: "100%",
    }}>
      <Image 
        source={characterImages[pattern.character]} 
        style={{ 
          width: 60, 
          height: 60,
          marginRight: 12,
        }} 
        contentFit="contain" 
      />
      <View style={{ 
        flex: 1, 
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        borderRadius: 12,
        borderTopLeftRadius: 4,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(236, 72, 153, 0.3)",
      }}>
        <Text style={{ 
          color: mypageText.mutedLight, 
          fontSize: mypageFont.meta, 
          lineHeight: 20,
        }}>
          {pattern.message}
        </Text>
      </View>
    </View>
  );
}
