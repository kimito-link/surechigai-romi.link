import { View, type ViewProps, type LayoutChangeEvent } from "react-native";
import { useEffect, useCallback, useRef } from "react";
import { useTutorial } from "@/lib/tutorial-context";

interface TutorialHighlightTargetProps extends ViewProps {
  /** チュートリアルのステップ番号（1から開始） */
  tutorialStep: number;
  /** ユーザータイプ（ファン向けか主催者向けか） */
  userType: "fan" | "host";
  /** 丸型ハイライトにするか */
  circular?: boolean;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * チュートリアル中にハイライトされる要素をラップするコンポーネント
 * 
 * 使い方:
 * ```tsx
 * <TutorialHighlightTarget tutorialStep={1} userType="fan">
 *   <ChallengeCard ... />
 * </TutorialHighlightTarget>
 * ```
 */
export function TutorialHighlightTarget({
  tutorialStep,
  userType,
  circular = false,
  children,
  ...props
}: TutorialHighlightTargetProps) {
  const tutorial = useTutorial();
  const viewRef = useRef<View>(null);
  const layoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    
    // 画面上の絶対位置を取得
    if (viewRef.current) {
      viewRef.current.measureInWindow((x, y, measuredWidth, measuredHeight) => {
        layoutRef.current = {
          x: x || 0,
          y: y || 0,
          width: measuredWidth || width,
          height: measuredHeight || height,
        };
        
        // 現在のステップがこの要素のステップで、ユーザータイプが一致する場合にハイライトを設定
        if (
          tutorial.isActive &&
          tutorial.userType === userType &&
          tutorial.currentStepIndex + 1 === tutorialStep
        ) {
          tutorial.setHighlight({
            ...layoutRef.current,
            circular,
          });
        }
      });
    }
  }, [tutorial, tutorialStep, userType, circular]);

  // チュートリアルステップが変わったときにハイライトを更新
  useEffect(() => {
    if (
      tutorial.isActive &&
      tutorial.userType === userType &&
      tutorial.currentStepIndex + 1 === tutorialStep &&
      layoutRef.current
    ) {
      // 少し遅延させて確実にレイアウトが完了してから設定
      const timer = setTimeout(() => {
        if (viewRef.current) {
          viewRef.current.measureInWindow((x, y, width, height) => {
            if (x !== undefined && y !== undefined) {
              tutorial.setHighlight({
                x,
                y,
                width,
                height,
                circular,
              });
            }
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [tutorial, tutorialStep, userType, circular]);

  return (
    <View ref={viewRef} onLayout={handleLayout} {...props}>
      {children}
    </View>
  );
}
