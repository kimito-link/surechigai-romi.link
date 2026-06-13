/**
 * lib/experience-context/types.ts
 * 
 * 追体験機能の型定義
 */

// 追体験のスライドタイプ
export type ExperienceSlide = {
  id: string;
  /** キャラクター */
  character: "rinku" | "konta" | "tanune" | "kimitolink";
  /** メインメッセージ */
  message: string;
  /** サブメッセージ（説明） */
  subMessage?: string;
  /** 心理描写（吹き出しで表示） */
  thought?: string;
  /** プレビュータイプ */
  previewType?: 
    | "map" 
    | "participants" 
    | "chart" 
    | "notification" 
    | "crown" 
    | "comment" 
    | "invite" 
    | "form" 
    | "prefecture" 
    | "profile" 
    | "influencer" 
    | "gender" 
    | "none"
    // 新しいプレビュータイプ
    | "challenge-card"
    | "progress-bar"
    | "countdown"
    | "achievement"
    | "share"
    | "ranking"
    | "dm"
    | "reminder"
    | "ticket"
    | "cheer"
    | "badge"
    | "stats"
    | "celebration";
  /** 背景色 */
  backgroundColor?: string;
  /** ステップ番号（チュートリアル用） */
  stepNumber?: number;
  /** ステップタイトル（チュートリアル用） */
  stepTitle?: string;
};

export type ExperienceType = "organizer" | "fan";

export type ExperienceContextType = {
  experienceType: ExperienceType | null;
  currentSlideIndex: number;
  startExperience: (type: ExperienceType) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  endExperience: () => void;
  currentSlide: ExperienceSlide | null;
  totalSlides: number;
  isActive: boolean;
};
