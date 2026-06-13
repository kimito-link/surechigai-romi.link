import { View } from "react-native";
import { useEffect, useRef } from "react";
import { useTutorial } from "@/lib/tutorial-context";
import { color } from "@/theme/tokens";
import { HapticTab } from "@/components/atoms/haptic-tab";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface TutorialTabButtonProps extends BottomTabBarButtonProps {
  /** チュートリアルのステップ番号（1から開始） */
  tutorialStep: number;
  /** ユーザータイプ（ファン向けか主催者向けか） */
  userType: "fan" | "host";
}

/**
 * チュートリアル中にハイライトされるタブボタン
 * 
 * ステップ3（ファン向け）で「作成」タブをハイライト
 * ステップ1（主催者向け）で「作成」タブをハイライト
 */
export function TutorialTabButton({
  tutorialStep,
  userType,
  ...props
}: TutorialTabButtonProps) {
  const tutorial = useTutorial();
  const viewRef = useRef<View>(null);
  
  // グローアニメーション
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  
  const shouldHighlight = 
    tutorial.isActive &&
    tutorial.userType === userType &&
    tutorial.currentStepIndex + 1 === tutorialStep;

  useEffect(() => {
    if (shouldHighlight) {
      // 静的なハイライト（ちかちかアニメーション削除）
      glowOpacity.value = withTiming(0.6, { duration: 300 });
      glowScale.value = withTiming(1.1, { duration: 300 });
      
      // ハイライト位置を設定
      if (viewRef.current) {
        viewRef.current.measureInWindow((x, y, width, height) => {
          if (x !== undefined && y !== undefined) {
            tutorial.setHighlight({
              x,
              y,
              width,
              height,
              circular: true,
            });
          }
        });
      }
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      glowScale.value = withTiming(1, { duration: 200 });
    }
  }, [shouldHighlight, glowOpacity, glowScale, tutorial]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View ref={viewRef} style={{ position: "relative" }}>
      {/* グローエフェクト */}
      {shouldHighlight && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: 24,
              backgroundColor: color.hostAccentLegacy,
            },
            glowStyle,
          ]}
        />
      )}
      
      {/* 元のタブボタン */}
      <HapticTab {...props} />
    </View>
  );
}

/**
 * ファン向けチュートリアル用のタブボタン（ステップ3でハイライト）
 */
export function FanTutorialCreateTabButton(props: BottomTabBarButtonProps) {
  return <TutorialTabButton tutorialStep={3} userType="fan" {...props} />;
}

/**
 * 主催者向けチュートリアル用のタブボタン（ステップ1でハイライト）
 */
export function HostTutorialCreateTabButton(props: BottomTabBarButtonProps) {
  return <TutorialTabButton tutorialStep={1} userType="host" {...props} />;
}
