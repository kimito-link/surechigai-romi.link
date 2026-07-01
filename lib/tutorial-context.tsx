/**
 * ログイン後チュートリアル — 状態管理（surechigai 向け・ユーザータイプ選択なし）
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TutorialStep } from "@/components/organisms/tutorial-overlay";
import { POST_LOGIN_LOCATION_INTRO_KEY } from "@/features/onboarding/constants";
import { SURECHIGAI_TUTORIAL_STEPS } from "@/lib/tutorial/surechigai-steps";
import { useAuth } from "@/hooks/use-auth";

import { TUTORIAL_SEEN_STORAGE_KEY } from "@/lib/tutorial/constants";

type TutorialContextType = {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  isCompleted: boolean;
  resetTutorial: () => Promise<void>;
  isInitialized: boolean;
};

const TutorialContext = createContext<TutorialContextType | null>(null);

async function readStorage(key: string): Promise<string | null> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(key);
    } catch {
      /* fall through */
    }
  }
  return AsyncStorage.getItem(key);
}

async function writeStorage(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
}

async function removeStorage(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(true);
  const startAttemptedRef = useRef(false);

  const steps = SURECHIGAI_TUTORIAL_STEPS;
  const currentStep = steps[currentStepIndex] ?? null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await readStorage(TUTORIAL_SEEN_STORAGE_KEY);
      if (cancelled) return;
      setIsCompleted(seen === "true");
      setIsInitialized(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSeen = useCallback(async () => {
    await writeStorage(TUTORIAL_SEEN_STORAGE_KEY, "true");
    setIsCompleted(true);
    setIsActive(false);
  }, []);

  const completeTutorial = useCallback(async () => {
    await persistSeen();
  }, [persistSeen]);

  const skipTutorial = useCallback(async () => {
    await persistSeen();
  }, [persistSeen]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      void completeTutorial();
    }
  }, [currentStepIndex, steps.length, completeTutorial]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const resetTutorial = useCallback(async () => {
    await removeStorage(TUTORIAL_SEEN_STORAGE_KEY);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    startAttemptedRef.current = false;
    if (isAuthenticated) {
      setIsActive(true);
    }
  }, [isAuthenticated]);

  // ログイン後 + 位置許可イントロ完了後に自動開始
  useEffect(() => {
    if (!isInitialized || !isAuthReady || !isAuthenticated || isCompleted || isActive) return;
    if (startAttemptedRef.current) return;

    let cancelled = false;
    let pollCount = 0;
    const maxPolls = 30;

    const tryStart = async () => {
      const locIntro = await readStorage(POST_LOGIN_LOCATION_INTRO_KEY);
      if (cancelled) return;
      if (locIntro !== "true") return false;

      const seen = await readStorage(TUTORIAL_SEEN_STORAGE_KEY);
      if (cancelled || seen === "true") return false;

      startAttemptedRef.current = true;
      setCurrentStepIndex(0);
      setTimeout(() => {
        if (!cancelled) setIsActive(true);
      }, 500);
      return true;
    };

    void tryStart();

    const interval = setInterval(() => {
      pollCount += 1;
      if (pollCount > maxPolls || startAttemptedRef.current) {
        clearInterval(interval);
        return;
      }
      void tryStart().then((started) => {
        if (started) clearInterval(interval);
      });
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isInitialized, isAuthReady, isAuthenticated, isCompleted, isActive]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsActive(false);
    }
  }, [isAuthenticated]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: steps.length,
        nextStep,
        prevStep,
        completeTutorial,
        skipTutorial,
        isCompleted,
        resetTutorial,
        isInitialized,
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

/** @deprecated surechigai では fan/host 分岐なし */
export type UserType = "fan" | "host";
