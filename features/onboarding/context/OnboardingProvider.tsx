/**
 * OnboardingProvider — オンボーディング状態をアプリ全体で共有
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY_LEGACY,
  type OnboardingSlide,
} from "../constants";
import { getVisibleOnboardingSlides } from "../slide-visibility";

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean | null;
  isShowingOnboarding: boolean;
  currentSlideIndex: number;
  isLastSlide: boolean;
  isFirstSlide: boolean;
  totalSlides: number;
  visibleSlides: OnboardingSlide[];
  goToNextSlide: () => void;
  goToPrevSlide: () => void;
  goToSlide: (index: number) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  showOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

async function readOnboardingCompleted(): Promise<boolean> {
  const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (completed === "true") return true;
  const legacy = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY_LEGACY);
  return legacy === "true";
}

function getInitialOnboardingStatus(): boolean | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (completed === "true") return true;
      const legacy = window.localStorage.getItem(ONBOARDING_STORAGE_KEY_LEGACY);
      return legacy === "true";
    } catch {
      return null;
    }
  }
  return null;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(
    getInitialOnboardingStatus,
  );
  const [isShowingOnboarding, setIsShowingOnboarding] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const visibleSlides = useMemo(() => getVisibleOnboardingSlides(), []);
  const totalSlides = visibleSlides.length;
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const isFirstSlide = currentSlideIndex === 0;

  useEffect(() => {
    if (hasCompletedOnboarding !== null) return;

    const RESTORE_TIMEOUT_MS = 2000;
    const timeoutId = setTimeout(() => {
      setHasCompletedOnboarding((prev) => (prev === null ? false : prev));
    }, RESTORE_TIMEOUT_MS);

    const checkOnboardingStatus = async () => {
      try {
        const completed = await Promise.race([
          readOnboardingCompleted(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), RESTORE_TIMEOUT_MS)),
        ]);
        setHasCompletedOnboarding(completed);
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        setHasCompletedOnboarding(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void checkOnboardingStatus();
    return () => clearTimeout(timeoutId);
  }, [hasCompletedOnboarding]);

  const showOnboarding = useCallback(() => {
    setCurrentSlideIndex(0);
    setIsShowingOnboarding(true);
  }, []);

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [currentSlideIndex, totalSlides]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlideIndex(index);
      }
    },
    [totalSlides],
  );

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      }
      setHasCompletedOnboarding(true);
      setIsShowingOnboarding(false);
    } catch (error) {
      console.error("Failed to save onboarding status:", error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      }
      setHasCompletedOnboarding(false);
      setCurrentSlideIndex(0);
      setIsShowingOnboarding(true);
    } catch (error) {
      console.error("Failed to reset onboarding status:", error);
    }
  }, []);

  const value = useMemo(
    (): OnboardingContextValue => ({
      hasCompletedOnboarding,
      isShowingOnboarding,
      currentSlideIndex,
      isLastSlide,
      isFirstSlide,
      totalSlides,
      visibleSlides,
      goToNextSlide,
      goToPrevSlide,
      goToSlide,
      completeOnboarding,
      resetOnboarding,
      showOnboarding,
    }),
    [
      hasCompletedOnboarding,
      isShowingOnboarding,
      currentSlideIndex,
      isLastSlide,
      isFirstSlide,
      totalSlides,
      visibleSlides,
      goToNextSlide,
      goToPrevSlide,
      goToSlide,
      completeOnboarding,
      resetOnboarding,
      showOnboarding,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within OnboardingProvider");
  }
  return ctx;
}
