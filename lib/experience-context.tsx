/**
 * lib/experience-context.tsx
 * 
 * 追体験機能のエントリーポイント（後方互換性のため維持）
 * 実装は lib/experience-context/ ディレクトリに分割
 */
export type { ExperienceSlide, ExperienceType, ExperienceContextType } from "./experience-context/types";
export { ORGANIZER_EXPERIENCE_SLIDES } from "./experience-context/organizer-slides";
export { FAN_EXPERIENCE_SLIDES } from "./experience-context/fan-slides";
export { ExperienceProvider, useExperience } from "./experience-context/provider";
