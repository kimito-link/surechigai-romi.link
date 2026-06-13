import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TutorialStep } from "@/components/organisms/tutorial-overlay";

const STORAGE_KEY_PREFIX = "tutorial_completed_";
const STORAGE_KEY_SEEN = "tutorial_seen";

export type UserType = "fan" | "host";

/**
 * ファン向けチュートリアルステップ（感情のベネフィット起点版）
 * 
 * 設計思想：
 * - 「相手がどう感じるか」を起点にする
 * - 押し付けがましくない、自然に「使いたい」と思える流れ
 * - 感情のベネフィット：ワクワク、達成感、所属感、安心感
 */
export const FAN_TUTORIAL_STEPS: TutorialStep[] = [
  // ========================================
  // 共感から入る（押し付けない）
  // ========================================
  {
    message: "推し活、楽しんでる？",
    subMessage: "ライブやイベント、最高だよね",
    character: "rinku_smile",
    speech: "推しに会える日って、本当に特別だよね！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  // ========================================
  // 感情ベネフィット1：形に残したい（達成感）
  // ========================================
  {
    message: "せっかくの参加、形に残したくない？",
    subMessage: "「あの日、あの場所にいた」って記録",
    character: "konta_normal",
    speech: "思い出って、時間が経つと薄れちゃうから...",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "参加表明で、記録が残るよ",
    subMessage: "いつ、どこに参加したか、ぜんぶ残る",
    character: "konta_smile",
    speech: "あとで見返すと「こんなに行ってたんだ！」ってなるよ",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "participants",
  },
  // ========================================
  // 感情ベネフィット2：つながりたい（所属感）
  // ========================================
  {
    message: "同じ推しのファン、気になる？",
    subMessage: "「この人も来るんだ」ってわかると安心",
    character: "rinku_normal",
    speech: "一人で遠征するとき、知ってる人がいると心強いよね",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "誰が参加するか見えるよ",
    subMessage: "参加者リストで、仲間を見つけられる",
    character: "tanune_smile",
    speech: "「あ、この人いつも来てる！」ってわかるの、嬉しいわよね",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "participants",
  },
  // ========================================
  // 感情ベネフィット2.5：状況共有でワクワク
  // ========================================
  {
    message: "「今向かってる！」って伝えたいとき、あるよね？",
    subMessage: "「もうすぐつくね！」ってワクワク感",
    character: "rinku_smile",
    speech: "イベント当日、みんなどこにいるか気になるよね！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "参加者の状況が見えるよ",
    subMessage: "「向かってる」「到着！」ってリアルタイムでわかる",
    character: "konta_smile",
    speech: "みんなの状況がわかると、一体感が生まれるよね！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "participants",
  },
  // ========================================
  // 感情ベネフィット3：認められたい（承認欲求・でも押し付けない）
  // ========================================
  {
    message: "何度も参加してると...",
    subMessage: "常連バッジがついて、ちょっと特別な気分",
    character: "konta_smile",
    speech: "「いつもありがとう」って思ってもらえてるかも？",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "pulse",
    previewType: "crown",
  },
  // ========================================
  // CTA（押し付けない、選択肢を与える）
  // ========================================
  {
    message: "気になるチャレンジ、探してみる？",
    subMessage: "参加するかどうかは、あなた次第",
    character: "kimitolink",
    speech: "無理しなくていいよ。気になったら覗いてみてね！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "confetti",
    previewType: "none",
  },
];

/**
 * 主催者向けチュートリアルステップ（感情のベネフィット起点版）
 * 
 * 設計思想：
 * - 「相手がどう感じるか」を起点にする
 * - 不安を煽らない、安心感を与える
 * - 感情のベネフィット：安心、ラク、自己実現
 */
export const HOST_TUTORIAL_STEPS: TutorialStep[] = [
  // ========================================
  // 共感から入る（不安を煽らない）
  // ========================================
  {
    message: "イベント運営、大変だよね",
    subMessage: "準備も当日も、やることいっぱい",
    character: "tanune_normal",
    speech: "私も最初は不安だらけだったわ...",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  // ========================================
  // 感情ベネフィット1：安心したい（不安解消）
  // ========================================
  {
    message: "「何人来るかな...」って不安、ない？",
    subMessage: "会場選び、難しいよね",
    character: "rinku_normal",
    speech: "大きすぎても小さすぎても困るし...",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "事前に参加者数がわかると安心",
    subMessage: "「今○人参加表明してる」ってリアルタイムで見える",
    character: "konta_smile",
    speech: "これなら会場選びも、心に余裕を持ってできるね",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "participants",
  },
  // ========================================
  // 感情ベネフィット2：ラクになりたい（負担軽減）
  // ========================================
  {
    message: "「どこでやろう...」って迷わない？",
    subMessage: "地方でやりたいけど、需要あるのかな...",
    character: "tanune_normal",
    speech: "手探りで決めるの、ストレスよね",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "ファンがどこにいるか、見えるよ",
    subMessage: "地域ごとの参加者がマップでわかる",
    character: "konta_normal",
    speech: "「北海道から来てる人多いな」→「北海道でもやれるかも？」",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "map",
  },
  {
    message: "データがあると、決めやすい",
    subMessage: "勘じゃなくて、根拠を持って判断できる",
    character: "tanune_smile",
    speech: "「ここなら人が集まりそう」って自信を持てるわ",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "pulse",
    previewType: "map",
  },
  // ========================================
  // 感情ベネフィット3：トラブル対応（安心感）
  // ========================================
  {
    message: "急なキャンセル、焦るよね",
    subMessage: "「仕事で行けなくなりました」...穴埋めどうしよう",
    character: "rinku_normal",
    speech: "せっかくの枠が空いちゃう...",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "参加者のTwitterがわかるから大丈夫",
    subMessage: "「1枠空きました！」ってすぐ呼びかけられる",
    character: "konta_smile",
    speech: "慌てなくていいよ。連絡手段があるから",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "notification",
  },
  // ========================================
  // 感情ベネフィット3.5：ファンの状況がわかる安心感
  // ========================================
  {
    message: "当日、ファンの状況が気になるよね",
    subMessage: "「あー、急に仕事が...」って人もいるし",
    character: "tanune_normal",
    speech: "「今向かってる」「もうすぐつくね」ってわかると安心よね",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "参加者の状況がリアルタイムで見える",
    subMessage: "「向かってる」「到着！」って状況がわかる",
    character: "konta_smile",
    speech: "「あと何人くるかな」って把握できるから安心！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "participants",
  },
  // ========================================
  // 感情ベネフィット4：ファンを大切にしたい（自己実現）
  // ========================================
  {
    message: "いつも来てくれる人、大切にしたいよね",
    subMessage: "感謝の気持ち、伝えたいけど...",
    character: "rinku_smile",
    speech: "「〇〇さん、いつもありがとう！」って言いたい",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "none",
    previewType: "none",
  },
  {
    message: "常連さんがひと目でわかるよ",
    subMessage: "参加回数が多い人には常連バッジがつく",
    character: "tanune_smile",
    speech: "「10回目の参加ありがとう！」って声かけられるわ",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "crown",
  },
  // ========================================
  // CTA（押し付けない、選択肢を与える）
  // ========================================
  {
    message: "試しに作ってみる？",
    subMessage: "まずは小さく始めてみるのもアリ",
    character: "kimitolink",
    speech: "無理しなくていいよ。気が向いたら使ってみてね！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "confetti",
    previewType: "none",
  },
];

type TutorialContextType = {
  /** チュートリアル未視聴かどうか */
  hasNotSeenTutorial: boolean;
  /** ユーザータイプ選択画面を表示中か */
  showUserTypeSelector: boolean;
  /** チュートリアル表示中かどうか */
  isActive: boolean;
  /** 現在のステップ（0から開始） */
  currentStepIndex: number;
  /** 現在のステップデータ */
  currentStep: TutorialStep | null;
  /** 総ステップ数 */
  totalSteps: number;
  /** ユーザータイプ選択を開始 */
  showTypeSelector: () => void;
  /** ユーザータイプを選択してチュートリアル開始 */
  selectUserType: (userType: UserType) => void;
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
  /** 初期化完了 */
  isInitialized: boolean;
  /** ログイン誘導モーダルを表示中か */
  showLoginPrompt: boolean;
  /** ログイン誘導モーダルを閉じる */
  dismissLoginPrompt: () => void;
};

const TutorialContext = createContext<TutorialContextType | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNotSeenTutorial, setHasNotSeenTutorial] = useState(false);
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<TutorialStep["highlight"]>();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 初期化：チュートリアル視聴状態を確認（ログイン状態に依存しない）
  useEffect(() => {
    const initialize = async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY_SEEN);
        
        // 一度も見ていない場合
        if (seen === null) {
          setHasNotSeenTutorial(true);
          setIsCompleted(false);
        } else {
          setHasNotSeenTutorial(false);
          setIsCompleted(true);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize tutorial:", error);
        setIsInitialized(true);
      }
    };
    initialize();
  }, []);

  // 初回起動時に自動でユーザータイプ選択を表示（ログイン不要）
  useEffect(() => {
    if (isInitialized && hasNotSeenTutorial && !isCompleted) {
      // 即座に表示（アプリ起動直後）
      const timer = setTimeout(() => {
        setShowUserTypeSelector(true);
      }, 500); // 0.5秒後に表示
      return () => clearTimeout(timer);
    }
  }, [isInitialized, hasNotSeenTutorial, isCompleted]);

  const showTypeSelector = useCallback(() => {
    setShowUserTypeSelector(true);
  }, []);

  const selectUserType = useCallback((type: UserType) => {
    setUserType(type);
    setSteps(type === "fan" ? FAN_TUTORIAL_STEPS : HOST_TUTORIAL_STEPS);
    setCurrentStepIndex(0);
    setShowUserTypeSelector(false);
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
    setHasNotSeenTutorial(false);
    
    // チュートリアル完了後、ログイン誘導モーダルを表示
    setTimeout(() => {
      setShowLoginPrompt(true);
    }, 500);
    
    try {
      // チュートリアル視聴済みフラグを保存
      await AsyncStorage.setItem(STORAGE_KEY_SEEN, "true");
      if (userType) {
        await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${userType}`, "true");
      }
    } catch (error) {
      console.error("Failed to save tutorial status:", error);
    }
  }, [userType]);

  const skipTutorial = useCallback(async () => {
    setShowUserTypeSelector(false);
    setIsActive(false);
    setIsCompleted(true);
    setHasNotSeenTutorial(false);
    try {
      // スキップした場合も視聴済みとして保存
      await AsyncStorage.setItem(STORAGE_KEY_SEEN, "true");
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
      await AsyncStorage.removeItem(STORAGE_KEY_SEEN);
      setIsCompleted(false);
      setHasNotSeenTutorial(true);
      setCurrentStepIndex(0);
      setUserType(null);
      setSteps([]);
      setShowLoginPrompt(false);
      // リセット後、即座にユーザータイプ選択を表示
      setTimeout(() => {
        setShowUserTypeSelector(true);
      }, 100);
    } catch (error) {
      console.error("Failed to reset tutorial:", error);
    }
  }, []);

  const dismissLoginPrompt = useCallback(() => {
    setShowLoginPrompt(false);
  }, []);

  // 現在のステップにハイライト情報をマージ
  const currentStep = steps[currentStepIndex]
    ? {
        ...steps[currentStepIndex],
        highlight: currentHighlight || steps[currentStepIndex].highlight,
      }
    : null;

  return (
    <TutorialContext.Provider
      value={{
        hasNotSeenTutorial,
        showUserTypeSelector,
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: steps.length,
        showTypeSelector,
        selectUserType,
        nextStep,
        completeCurrentStep,
        completeTutorial,
        skipTutorial,
        isCompleted,
        userType,
        setHighlight,
        resetTutorial,
        isInitialized,
        showLoginPrompt,
        dismissLoginPrompt,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
