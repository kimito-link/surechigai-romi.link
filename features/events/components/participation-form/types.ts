/**
 * features/events/components/participation-form/types.ts
 * 
 * ParticipationFormコンポーネントの型定義
 */

import type { FormGender } from "@/components/ui";

export type Companion = {
  id: string;
  displayName: string;
  twitterUsername: string;
  twitterId?: string;
  profileImage?: string;
};

export type LookedUpProfile = {
  id: string;
  name: string;
  username: string;
  profileImage: string;
};

export type ParticipationFormProps = {
  // ユーザー情報
  user: {
    name?: string;
    username?: string;
    profileImage?: string;
    followersCount?: number;
  } | null;
  isLoggedIn: boolean;
  onLogin: () => void;
  
  // フォーム状態
  message: string;
  onMessageChange: (text: string) => void;
  prefecture: string;
  onPrefectureChange: (pref: string) => void;
  gender: FormGender;
  onGenderChange: (gender: FormGender) => void;
  allowVideoUse: boolean;
  onAllowVideoUseChange: (allow: boolean) => void;
  
  // 参加方法
  attendanceType: "venue" | "streaming" | "both";
  onAttendanceTypeChange: (type: "venue" | "streaming" | "both") => void;
  
  // 都道府県選択
  showPrefectureList: boolean;
  onTogglePrefectureList: () => void;
  
  // 友人追加
  companions: Companion[];
  showAddCompanionForm: boolean;
  onToggleAddCompanionForm: () => void;
  newCompanionName: string;
  onNewCompanionNameChange: (name: string) => void;
  newCompanionTwitter: string;
  onNewCompanionTwitterChange: (twitter: string) => void;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
  onLookupTwitterProfile: (username: string) => void;
  onAddCompanion: () => void;
  onRemoveCompanion: (id: string) => void;
  onCancelAddCompanion: () => void;
  
  // 送信
  onSubmit: () => void;
  isSubmitting: boolean;
  
  // 編集モード
  isEditMode?: boolean;
  hasExistingParticipation?: boolean;
};
