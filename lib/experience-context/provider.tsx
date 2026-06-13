/**
 * lib/experience-context/provider.tsx
 * 
 * 追体験機能のコンテキストプロバイダー
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ExperienceType, ExperienceContextType, ExperienceSlide } from "./types";
import { ORGANIZER_EXPERIENCE_SLIDES } from "./organizer-slides";
import { FAN_EXPERIENCE_SLIDES } from "./fan-slides";

const ExperienceContext = createContext<ExperienceContextType | undefined>(undefined);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [experienceType, setExperienceType] = useState<ExperienceType | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides = experienceType === "organizer" 
    ? ORGANIZER_EXPERIENCE_SLIDES 
    : experienceType === "fan" 
    ? FAN_EXPERIENCE_SLIDES 
    : [];

  const startExperience = useCallback((type: ExperienceType) => {
    setExperienceType(type);
    setCurrentSlideIndex(0);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // 最後のスライドなら終了
      setExperienceType(null);
      setCurrentSlideIndex(0);
    }
  }, [currentSlideIndex, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  const endExperience = useCallback(() => {
    setExperienceType(null);
    setCurrentSlideIndex(0);
  }, []);

  const currentSlide = slides[currentSlideIndex] || null;

  return (
    <ExperienceContext.Provider
      value={{
        experienceType,
        currentSlideIndex,
        startExperience,
        nextSlide,
        prevSlide,
        endExperience,
        currentSlide,
        totalSlides: slides.length,
        isActive: experienceType !== null,
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within an ExperienceProvider");
  }
  return context;
}
