/**
 * オンボーディング表示スライド
 */

import { Platform } from "react-native";
import { ONBOARDING_SLIDES, type OnboardingSlide } from "./constants";

export function isPwaStandalone(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function getVisibleOnboardingSlides(): OnboardingSlide[] {
  return ONBOARDING_SLIDES;
}
