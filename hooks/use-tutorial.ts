import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TutorialStep } from "@/components/organisms/tutorial-overlay";

const STORAGE_KEY_PREFIX = "tutorial_completed_";

export type UserType = "fan" | "host";

/**
 * ファン向けチュートリアルステップ
 * 任天堂原則：
 * - 説明しない
 * - 失敗させない
 * - 1アクション＝1学習
 */
export const FAN_TUTORIAL_STEPS: TutorialStep[] = [
  {
    message: "推しを見つけよう",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
  },
  {
    message: "参加しよう",
    messagePosition: "bottom",
    tapToContinue: false, // 参加ボタンを押すまで待つ
    successAnimation: "pulse",
  },
  {
    message: "自分のも作れるよ",
    messagePosition: "top",
    tapToContinue: true,
    successAnimation: "confetti",
  },
];

/**
 * 主催者向けチュートリアルステップ
 */
export const HOST_TUTORIAL_STEPS: TutorialStep[] = [
  {
    message: "チャレンジを作ろう",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
  },
  {
    message: "目標を決めよう",
    messagePosition: "bottom",
    tapToContinue: false, // 目標入力まで待つ
    successAnimation: "pulse",
  },
  {
    message: "公開しよう",
    messagePosition: "bottom",
    tapToContinue: false, // 公開ボタンを押すまで待つ
    successAnimation: "confetti",
  },
];

type UseTutorialReturn = {
  /** チュートリアル表示中かどうか */
  isActive: boolean;
  /** 現在のステップ（0から開始） */
  currentStepIndex: number;
  /** 現在のステップデータ */
  currentStep: TutorialStep | null;
  /** 総ステップ数 */
  totalSteps: number;
  /** チュートリアルを開始 */
  startTutorial: (userType: UserType) => void;
  /** 次のステップに進む */
  nextStep: () => void;
  /** 特定のステップを完了としてマーク（アクション完了時） */
  completeCurrentStep: () => void;
  /** チュートリアルを終了 */
  completeTutorial: () => void;
  /** チュートリアルをスキップ */
  skipTutorial: () => void;
  /** チュートリアル完了済みかどうか */
  isCompleted: boolean;
  /** 現在のユーザータイプ */
  userType: UserType | null;
  /** ハイライト位置を更新 */
  setHighlight: (highlight: TutorialStep["highlight"]) => void;
  /** チュートリアル完了状態をリセット（設定画面用） */
  resetTutorial: () => Promise<void>;
};

/**
 * チュートリアル管理フック
 * 
 * 使用例：
 * ```tsx
 * const { isActive, currentStep, startTutorial, nextStep } = useTutorial();
 * 
 * // 初回起動時
 * useEffect(() => {
 *   if (!isCompleted) {
 *     startTutorial("fan");
 *   }
 * }, []);
 * ```
 */
export function useTutorial(): UseTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<TutorialStep["highlight"]>();

  // 完了状態を読み込み
  useEffect(() => {
    const loadCompletionStatus = async () => {
      try {
        const fanCompleted = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}fan`);
        const hostCompleted = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}host`);
        // どちらかが完了していれば完了とみなす
        setIsCompleted(fanCompleted === "true" || hostCompleted === "true");
      } catch (error) {
        console.error("Failed to load tutorial status:", error);
      }
    };
    loadCompletionStatus();
  }, []);

  const startTutorial = useCallback((type: UserType) => {
    setUserType(type);
    setSteps(type === "fan" ? FAN_TUTORIAL_STEPS : HOST_TUTORIAL_STEPS);
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setCurrentHighlight(undefined);
    } else {
      completeTutorial();
    }
  }, [currentStepIndex, steps.length]);

  const completeCurrentStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const completeTutorial = useCallback(async () => {
    setIsActive(false);
    setIsCompleted(true);
    if (userType) {
      try {
        await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${userType}`, "true");
      } catch (error) {
        console.error("Failed to save tutorial status:", error);
      }
    }
  }, [userType]);

  const skipTutorial = useCallback(async () => {
    setIsActive(false);
    setIsCompleted(true);
    // スキップした場合も完了として保存
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}fan`, "true");
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}host`, "true");
    } catch (error) {
      console.error("Failed to save tutorial status:", error);
    }
  }, []);

  const setHighlight = useCallback((highlight: TutorialStep["highlight"]) => {
    setCurrentHighlight(highlight);
  }, []);

  const resetTutorial = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}fan`);
      await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}host`);
      setIsCompleted(false);
      setCurrentStepIndex(0);
      setUserType(null);
      setSteps([]);
    } catch (error) {
      console.error("Failed to reset tutorial:", error);
    }
  }, []);

  // 現在のステップにハイライト情報をマージ
  const currentStep = steps[currentStepIndex]
    ? {
        ...steps[currentStepIndex],
        highlight: currentHighlight || steps[currentStepIndex].highlight,
      }
    : null;

  return {
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    startTutorial,
    nextStep,
    completeCurrentStep,
    completeTutorial,
    skipTutorial,
    isCompleted,
    userType,
    setHighlight,
    resetTutorial,
  };
}
