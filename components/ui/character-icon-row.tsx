/**
 * CharacterIconRow Component
 * 複数キャラクターアイコンの横並び表示
 * 汎用UIコンポーネント - 様々な画面で再利用可能
 */

import { View, Pressable, ImageSourcePropType, Platform } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

export interface CharacterIconConfig {
  /** 一意の識別子 */
  id?: string;
  /** 画像ソース */
  image: ImageSourcePropType;
  /** アイコンサイズ（幅・高さ） */
  size: number;
  /** ボーダー幅 */
  borderWidth: number;
  /** ボーダー色 */
  borderColor: string;
  /** キャラクター名（モーダル表示用） */
  name?: string;
  /** キャラクター説明（モーダル表示用） */
  description?: string;
}

export interface CharacterIconRowProps {
  /** アイコン設定の配列 */
  icons: CharacterIconConfig[];
  /** アイコン間のギャップ */
  gap?: number;
  /** 下部マージン */
  marginBottom?: number;
  /** 上部マージン */
  marginTop?: number;
  /** 中央揃えにするか */
  centered?: boolean;
  /** アイコンタップ時のコールバック */
  onIconPress?: (icon: CharacterIconConfig, index: number) => void;
  /** タップ可能かどうか */
  pressable?: boolean;
}

/**
 * 複数のキャラクターアイコンを横並びで表示するコンポーネント
 * 
 * @example
 * ```tsx
 * <CharacterIconRow
 *   icons={[
 *     { id: "char1", image: require("@/assets/images/char1.png"), size: 56, borderWidth: 2, borderColor: palette.pink500, name: "キャラ1" },
 *     { id: "char2", image: require("@/assets/images/char2.png"), size: 64, borderWidth: 3, borderColor: palette.gold, name: "キャラ2" },
 *   ]}
 *   gap={12}
 *   marginBottom={24}
 *   pressable
 *   onIconPress={(icon) => console.log("Tapped:", icon.name)}
 * />
 * ```
 */
export function CharacterIconRow({ 
  icons, 
  gap = 12, 
  marginBottom = 0,
  marginTop = 0,
  centered = true,
  onIconPress,
  pressable = false,
}: CharacterIconRowProps) {
  const handlePress = (icon: CharacterIconConfig, index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onIconPress?.(icon, index);
  };

  return (
    <View style={{ 
      flexDirection: "row", 
      justifyContent: centered ? "center" : "flex-start", 
      gap,
      marginBottom,
      marginTop,
    }}>
      {icons.map((icon, index) => {
        const innerSize = icon.size - (icon.borderWidth * 2);
        const iconContent = (
          <View style={{ 
            width: icon.size, 
            height: icon.size, 
            borderRadius: icon.size / 2, 
            borderWidth: icon.borderWidth, 
            borderColor: icon.borderColor,
            overflow: "hidden",
          }}>
            <Image 
              source={icon.image} 
              style={{ width: innerSize, height: innerSize }} 
              contentFit="cover"
              priority="high"
              cachePolicy="memory-disk"
            />
          </View>
        );

        if (pressable && onIconPress) {
          return (
            <Pressable
              key={icon.id ?? index}
              onPress={() => handlePress(icon, index)}
              style={({ pressed }) => [
                { alignItems: "center" },
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
              ]}
            >
              {iconContent}
            </Pressable>
          );
        }

        return (
          <View key={icon.id ?? index} style={{ alignItems: "center" }}>
            {iconContent}
          </View>
        );
      })}
    </View>
  );
}
