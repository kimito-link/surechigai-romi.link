/**
 * useOnboarding Hook
 * オンボーディングの状態管理
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_STORAGE_KEY, ONBOARDING_SLIDES } from "../constants";

interface UseOnboardingReturn {
  // State
  hasCompletedOnboarding: boolean | null;
  currentSlideIndex: number;
  isLastSlide: boolean;
  isFirstSlide: boolean;
  totalSlides: number;
  
  // Actions
  goToNextSlide: () => void;
  goToPrevSlide: () => void;
  goToSlide: (index: number) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

/**
 * Web環境ではlocalStorageから同期的にオンボーディング状態を取得
 * AsyncStorageの非同期待ちによるブロッキング（100-300ms）を回避
 */
function getInitialOnboardingStatus(): boolean | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return completed === "true";
    } catch {
      // localStorage未対応の場合はnull（非同期フォールバックに任せる）
    }
  }
  return null; // ネイティブの場合は非同期で取得
}

export function useOnboarding(): UseOnboardingReturn {
  // Web: localStorageから同期的に初期値を取得（null回避）
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(getInitialOnboardingStatus);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  const totalSlides = ONBOARDING_SLIDES.length;
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const isFirstSlide = currentSlideIndex === 0;
  
  // ネイティブ環境: 初回起動時にAsyncStorageからオンボーディング完了状態を確認
  // Web環境: 初期値がnullの場合のフォールバック（通常は同期取得済み）
  // シークレットモード対応: タイムアウトでブロックを防止
  useEffect(() => {
    if (hasCompletedOnboarding !== null) return; // 既に同期取得済み

    const RESTORE_TIMEOUT_MS = 2000;
    const timeoutId = setTimeout(() => {
      setHasCompletedOnboarding((prev) => (prev === null ? false : prev));
    }, RESTORE_TIMEOUT_MS);

    const checkOnboardingStatus = async () => {
      try {
        const completed = await Promise.race([
          AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS)),
        ]);
        setHasCompletedOnboarding(completed === "true");
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        setHasCompletedOnboarding(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkOnboardingStatus();
    return () => clearTimeout(timeoutId);
  }, [hasCompletedOnboarding]);
  
  const goToNextSlide = useCallback(() => {
    if (!isLastSlide) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [isLastSlide]);
  
  const goToPrevSlide = useCallback(() => {
    if (!isFirstSlide) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [isFirstSlide]);
  
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlideIndex(index);
    }
  }, [totalSlides]);
  
  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Failed to save onboarding status:", error);
    }
  }, []);
  
  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setHasCompletedOnboarding(false);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error("Failed to reset onboarding status:", error);
    }
  }, []);
  
  return {
    hasCompletedOnboarding,
    currentSlideIndex,
    isLastSlide,
    isFirstSlide,
    totalSlides,
    goToNextSlide,
    goToPrevSlide,
    goToSlide,
    completeOnboarding,
    resetOnboarding,
  };
}
