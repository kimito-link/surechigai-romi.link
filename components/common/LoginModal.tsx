/**
 * LoginModal Component
 * 共通ログイン確認モーダル
 * 
 * すべての画面（ホーム、チャレンジ、マイページ）で使用する統一されたログインUI
 * 
 * 機能:
 * - 3キャラクター（りんく、こん太、たぬ姉）のバリエーション
 * - 5種類のメッセージバリエーション
 * - A/Bテスト（表示回数・ログイン成功率の記録）
 */

import { View, Text, Modal, Pressable } from "react-native";
import { color, palette } from "@/theme/tokens";
import { Button } from "../ui/button";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useEffect, useState, useRef } from "react";
import { useLoginABTest } from "@/hooks/use-login-ab-test";

const AnimatedImage = Animated.createAnimatedComponent(Image);

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像）
const CHARACTER_IMAGES = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

interface LoginModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LoginModal({ 
  visible, 
  onConfirm, 
  onCancel 
}: LoginModalProps) {
  const { selectMessage, recordConversion } = useLoginABTest();
  const [currentMessage, setCurrentMessage] = useState<ReturnType<typeof selectMessage> | null>(null);
  const wasVisibleRef = useRef(false);
  const [imageError, setImageError] = useState(false);

  // モーダルが表示されるたびにメッセージを選択（ちらつき防止: 一度だけ選択）
  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      // 初めて表示される時だけメッセージを選択
      const message = selectMessage();
      setCurrentMessage(message);
      wasVisibleRef.current = true;
    } else if (!visible && wasVisibleRef.current) {
      // モーダルが閉じられたらリセット（次回表示時に新しいメッセージを選択）
      wasVisibleRef.current = false;
      // ちらつきを防ぐため、少し遅延してクリア
      const timer = setTimeout(() => {
        setCurrentMessage(null);
      }, 300); // フェードアニメーション完了後にクリア
      return () => clearTimeout(timer);
    }
  }, [visible, selectMessage]);

  // ログイン確認時にコンバージョンを記録
  const handleConfirm = () => {
    recordConversion();
    onConfirm();
  };

  // キャラクターのバウンスアニメーション（ちらつき防止: モーダル表示時のみ有効）
  const characterAnimatedStyle = useAnimatedStyle(() => {
    if (!visible) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [
        {
          translateY: withRepeat(
            withSequence(
              withSpring(-5, { damping: 10, stiffness: 100 }),
              withSpring(0, { damping: 10, stiffness: 100 })
            ),
            -1, // 無限ループ
            false
          ),
        },
      ],
    };
  }, [visible]);

  // モーダルが非表示のときは何もレンダリングしない（ちらつき防止）
  if (!visible || !currentMessage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable 
        style={{ 
          flex: 1, 
          backgroundColor: palette.black + "E6",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          zIndex: 10000,
          elevation: 10000,
        }}
        onPress={onCancel}
      >
        <Pressable 
          style={{ 
            backgroundColor: color.surface,
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: "100%",
            borderWidth: 1,
            borderColor: color.borderAlt,
            shadowColor: palette.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 24,
            zIndex: 10001,
            elevation: 10001,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* タイトル */}
          <Text style={{ 
            fontSize: 22, 
            fontWeight: "700", 
            color: color.textPrimary,
            marginBottom: 20,
            textAlign: "center",
            letterSpacing: 0,
          }}>
            Xでログインしますか？
          </Text>

          {/* 説明 */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 15, 
              color: color.textSecondary,
              marginBottom: 6,
              lineHeight: 22,
              textAlign: "center",
            }}>
              このあとXの公式認証画面に移動します。
            </Text>
            <Text style={{ 
              fontSize: 15, 
              color: color.textSecondary,
              lineHeight: 22,
              textAlign: "center",
            }}>
              kimito.link と同じXログイン基盤を使い、完了後にこのアプリへ戻ります。
            </Text>
          </View>

          {/* キャラクターの吹き出し */}
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={{ 
              flexDirection: "row", 
              alignItems: "flex-start", 
              marginBottom: 28,
              backgroundColor: color.surfaceAlt,
              borderWidth: 1,
              borderColor: color.border,
              padding: 20,
              borderRadius: 16,
              shadowColor: palette.gray900,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {!imageError ? (
              <AnimatedImage
                source={CHARACTER_IMAGES[currentMessage.character]}
                style={[
                  { width: 64, height: 64, marginRight: 12 },
                  characterAnimatedStyle,
                ]}
                onError={() => setImageError(true)}
                cachePolicy="memory-disk"
                contentFit="contain"
              />
            ) : (
              <Animated.View
                style={[
                  { width: 64, height: 64, marginRight: 12, borderRadius: 32, backgroundColor: color.accentPrimary, alignItems: "center", justifyContent: "center" },
                  characterAnimatedStyle,
                ]}
              >
                <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                  {currentMessage.character === "rinku" ? "り" : currentMessage.character === "konta" ? "こ" : "た"}
                </Text>
              </Animated.View>
            )}
            <Animated.View 
              entering={FadeInUp.delay(400).springify()}
              style={{ flex: 1 }}
            >
              <Text style={{ 
                fontSize: 15, 
                color: color.textPrimary,
                lineHeight: 23,
                fontWeight: "500",
              }}>
                {currentMessage.message}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* ボタン */}
          <View style={{ gap: 12 }}>
            <Button
              onPress={handleConfirm}
              icon="login"
              style={{ backgroundColor: palette.black }}
            >
              説明を確認してXへ進む
            </Button>
            <Button
              onPress={onCancel}
              variant="outline"
            >
              やめておく
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
