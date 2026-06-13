import { useState, useEffect, useCallback } from "react";
import { color, palette } from "@/theme/tokens";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像を統一使用）
const CHARACTER_IMAGES = {
  rinku: {
    normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-closed.png"),
    sad: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-closed.png"),
    worried: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-open.png"),
  },
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

// バリデーションエラーメッセージ
const VALIDATION_MESSAGES = {
  title: [
    { character: "rinku", text: "チャレンジ名を入れてね！", expression: "worried" },
    { character: "konta", text: "名前がないと始まらないよ〜", expression: "normal" },
    { character: "tanune", text: "まずはタイトルを決めよう！", expression: "normal" },
  ],
  date: [
    { character: "rinku", text: "開催日を選んでね！", expression: "worried" },
    { character: "konta", text: "いつやるの？日付を教えて！", expression: "normal" },
    { character: "tanune", text: "日程が決まってないと参加できないよ〜", expression: "normal" },
  ],
  host: [
    { character: "rinku", text: "ログインしてね！", expression: "sad" },
    { character: "konta", text: "誰が主催するの？", expression: "normal" },
    { character: "tanune", text: "Xでログインしよう！", expression: "normal" },
  ],
  general: [
    { character: "rinku", text: "まだ必要項目が入ってないよ！", expression: "worried" },
    { character: "konta", text: "あれ？何か足りないみたい...", expression: "normal" },
    { character: "tanune", text: "もう少し入力してね！", expression: "normal" },
  ],
};

type ValidationField = keyof typeof VALIDATION_MESSAGES;
type CharacterType = "rinku" | "konta" | "tanune";

interface ValidationError {
  field: ValidationField;
  message?: string;
}

interface CharacterValidationErrorProps {
  errors: ValidationError[];
  visible: boolean;
}

export function CharacterValidationError({ errors, visible }: CharacterValidationErrorProps) {
  const [currentMessage, setCurrentMessage] = useState<{ character: CharacterType; text: string; expression: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const bounceY = useSharedValue(0);
  const shake = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  useEffect(() => {
    if (visible && errors.length > 0) {
      const error = errors[0];
      const messages = VALIDATION_MESSAGES[error.field] || VALIDATION_MESSAGES.general;
      const randomIndex = Math.floor(Math.random() * messages.length);
      setCurrentMessage(messages[randomIndex] as { character: CharacterType; text: string; expression: string });
      
      // 静的な表示（ちかちかアニメーション削除）
      bounceY.value = withTiming(0, { duration: 200 });
      shake.value = withTiming(0, { duration: 200 });
      
      triggerHaptic();
    } else {
      setCurrentMessage(null);
    }
  }, [visible, errors, bounceY, shake, triggerHaptic]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { translateX: shake.value },
    ],
  }));

  if (!visible || !currentMessage) {
    return null;
  }

  const getCharacterImage = () => {
    if (currentMessage.character === "rinku") {
      const expression = currentMessage.expression as keyof typeof CHARACTER_IMAGES.rinku;
      return CHARACTER_IMAGES.rinku[expression] || CHARACTER_IMAGES.rinku.normal;
    }
    return CHARACTER_IMAGES[currentMessage.character];
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.characterContainer, animatedStyle]}>
          {!imageError ? (
            <Image
              source={getCharacterImage()}
              style={styles.character}
              contentFit="contain"
              onError={() => setImageError(true)}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.character, { borderRadius: 30, backgroundColor: color.accentPrimary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                {currentMessage.character === "rinku" ? "り" : currentMessage.character === "konta" ? "こ" : "た"}
              </Text>
            </View>
          )}
        </Animated.View>
        
        <View style={styles.bubbleContainer}>
          <View style={styles.bubble}>
            <View style={styles.bubbleArrow} />
            <Text style={styles.bubbleText}>{currentMessage.text}</Text>
          </View>
          <Text style={styles.characterName}>
            {currentMessage.character === "rinku" ? "りんく" : 
             currentMessage.character === "konta" ? "こん太" : "たぬ姉"}
          </Text>
        </View>
      </View>
      
      {errors.length > 1 && (
        <Text style={styles.moreErrors}>
          他にも{errors.length - 1}件の入力が必要です
        </Text>
      )}
    </Animated.View>
  );
}

// 複数キャラクターが一緒にエラーを表示するバージョン
interface CharacterGroupValidationErrorProps {
  errors: ValidationError[];
  visible: boolean;
}

export function CharacterGroupValidationError({ errors, visible }: CharacterGroupValidationErrorProps) {
  const bounceY = useSharedValue(0);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>("rinku");
  const [message, setMessage] = useState("まだ必要項目が入ってないよ！");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  useEffect(() => {
    if (visible && errors.length > 0) {
      // ランダムにキャラクターを選択
      const characters: CharacterType[] = ["rinku", "konta", "tanune"];
      const randomChar = characters[Math.floor(Math.random() * characters.length)];
      setSelectedCharacter(randomChar);
      
      // エラーに応じたメッセージを選択
      const error = errors[0];
      const messages = VALIDATION_MESSAGES[error.field] || VALIDATION_MESSAGES.general;
      const charMessage = messages.find(m => m.character === randomChar) || messages[0];
      setMessage(charMessage.text);
      
      // 静的な表示（ちかちかアニメーション削除）
      bounceY.value = withTiming(0, { duration: 200 });
      
      triggerHaptic();
    }
  }, [visible, errors, bounceY, triggerHaptic]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.groupContainer}
    >
      {/* 3キャラクター表示 */}
      <View style={styles.charactersRow}>
        <View style={[styles.sideCharacter, selectedCharacter !== "konta" && styles.dimmed]}>
          {!imageErrors.konta ? (
            <Image
              source={CHARACTER_IMAGES.konta}
              style={styles.smallCharacter}
              contentFit="contain"
              onError={() => setImageErrors(prev => ({ ...prev, konta: true }))}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.smallCharacter, { borderRadius: 20, backgroundColor: color.accentPrimary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>こ</Text>
            </View>
          )}
        </View>
        
        <Animated.View style={[styles.mainCharacter, animatedStyle]}>
          {/* 吹き出し */}
          <View style={styles.groupBubble}>
            <Text style={styles.groupBubbleText}>{message}</Text>
            <View style={styles.groupBubbleArrow} />
          </View>
          {!imageErrors[selectedCharacter] ? (
            <Image
              source={selectedCharacter === "rinku" 
                ? CHARACTER_IMAGES.rinku.worried 
                : CHARACTER_IMAGES[selectedCharacter]}
              style={styles.centerCharacter}
              contentFit="contain"
              onError={() => setImageErrors(prev => ({ ...prev, [selectedCharacter]: true }))}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.centerCharacter, { borderRadius: 35, backgroundColor: color.accentPrimary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
                {selectedCharacter === "rinku" ? "り" : selectedCharacter === "konta" ? "こ" : "た"}
              </Text>
            </View>
          )}
        </Animated.View>
        
        <View style={[styles.sideCharacter, selectedCharacter !== "tanune" && styles.dimmed]}>
          {!imageErrors.tanune ? (
            <Image
              source={CHARACTER_IMAGES.tanune}
              style={styles.smallCharacter}
              contentFit="contain"
              onError={() => setImageErrors(prev => ({ ...prev, tanune: true }))}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.smallCharacter, { borderRadius: 20, backgroundColor: color.accentPrimary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>た</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* エラー一覧 */}
      <View style={styles.errorList}>
        {errors.map((error, index) => (
          <View key={index} style={styles.errorItem}>
            <Text style={styles.errorDot}>•</Text>
            <Text style={styles.errorText}>
              {error.field === "title" && "チャレンジ名"}
              {error.field === "date" && "開催日"}
              {error.field === "host" && "ログイン"}
              {error.field === "general" && "必須項目"}
              が必要です
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.pink500 + "26", // 15% opacity
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.pink500 + "4D", // 30% opacity
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  characterContainer: {
    marginRight: 12,
  },
  character: {
    width: 60,
    height: 60,
  },
  bubbleContainer: {
    flex: 1,
  },
  bubble: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    padding: 12,
    position: "relative",
  },
  bubbleArrow: {
    position: "absolute",
    left: -8,
    top: "50%",
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: color.accentPrimary,
  },
  bubbleText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  characterName: {
    color: color.accentPrimary,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  moreErrors: {
    color: color.accentPrimary,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  
  // グループバージョンのスタイル
  groupContainer: {
    backgroundColor: palette.pink500 + "1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.pink500 + "40", // 25% opacity
  },
  charactersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 12,
  },
  sideCharacter: {
    marginHorizontal: 4,
  },
  mainCharacter: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  smallCharacter: {
    width: 40,
    height: 40,
  },
  centerCharacter: {
    width: 70,
    height: 70,
  },
  dimmed: {
    opacity: 0.5,
  },
  groupBubble: {
    backgroundColor: color.accentPrimary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    position: "relative",
  },
  groupBubbleText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  groupBubbleArrow: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: color.accentPrimary,
  },
  errorList: {
    backgroundColor: palette.black + "33", // 20% opacity
    borderRadius: 8,
    padding: 12,
  },
  errorItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  errorDot: {
    color: color.accentPrimary,
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    color: color.textMuted,
    fontSize: 13,
  },
});
