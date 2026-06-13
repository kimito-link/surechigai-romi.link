/**
 * WelcomeMessage Component
 * ログイン後のウェルカムメッセージ
 * 
 * ログイン成功後に3秒間表示されるウェルカムメッセージ
 * キャラクターがランダムに選択され、アニメーション付きで表示される
 */

import { View, Modal, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { palette } from "@/theme/tokens";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { getRandomLoginMessage, type LoginMessage } from "@/constants/login-messages";

const AnimatedImage = Animated.createAnimatedComponent(Image);

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像）
const CHARACTER_IMAGES = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

interface WelcomeMessageProps {
  visible: boolean;
  onHide: () => void;
  userName?: string;
}

export function WelcomeMessage({ visible, onHide, userName }: WelcomeMessageProps) {
  const colors = useColors();
  const [message, setMessage] = useState<LoginMessage | null>(null);
  const [imageError, setImageError] = useState(false);

  // 表示時にランダムなメッセージを選択
  useEffect(() => {
    if (visible) {
      setMessage(getRandomLoginMessage());
      
      // 3秒後に自動的に非表示
      const timer = setTimeout(() => {
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  // キャラクターのバウンスアニメーション
  const characterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withRepeat(
            withSequence(
              withSpring(-8, { damping: 10, stiffness: 100 }),
              withSpring(0, { damping: 10, stiffness: 100 })
            ),
            -1, // 無限ループ
            false
          ),
        },
      ],
    };
  });

  if (!message) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.black + "99", // 60% opacity
        }}
      >
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown.springify()}
          style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 32,
            maxWidth: 400,
            width: "90%",
            alignItems: "center",
            shadowColor: palette.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* キャラクター */}
          {!imageError ? (
            <AnimatedImage
              source={CHARACTER_IMAGES[message.character]}
              style={[
                { width: 80, height: 80, marginBottom: 20 },
                characterAnimatedStyle,
              ]}
              onError={() => setImageError(true)}
              cachePolicy="memory-disk"
              contentFit="contain"
            />
          ) : (
            <Animated.View
              style={[
                { width: 80, height: 80, marginBottom: 20, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
                characterAnimatedStyle,
              ]}
            >
              <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
                {message.character === "rinku" ? "り" : message.character === "konta" ? "こ" : "た"}
              </Text>
            </Animated.View>
          )}

          {/* ウェルカムメッセージ */}
          <Animated.Text
            entering={FadeIn.delay(200)}
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            おかえりなさい！
          </Animated.Text>

          {/* ユーザー名 */}
          {userName && (
            <Animated.Text
              entering={FadeIn.delay(300)}
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.primary,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {userName}さん
            </Animated.Text>
          )}

          {/* キャラクターメッセージ */}
          <Animated.Text
            entering={FadeIn.delay(400)}
            style={{
              fontSize: 15,
              color: colors.muted,
              lineHeight: 23,
              textAlign: "center",
            }}
          >
            {getWelcomeMessage(message.character)}
          </Animated.Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * キャラクターごとのウェルカムメッセージを取得
 */
function getWelcomeMessage(character: "rinku" | "konta" | "tanune"): string {
  const messages = {
    rinku: "今日も一緒に推し活を楽しもう！",
    konta: "みんなで盛り上がっていこう！",
    tanune: "あなたの応援、しっかり記録するね！",
  };
  return messages[character];
}
