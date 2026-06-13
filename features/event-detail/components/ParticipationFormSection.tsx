/**
 * ParticipationFormSection Component
 * 参加表明フォーム全体
 * 
 * 分割されたサブコンポーネント:
 * - FormInputSection: フォーム入力部分（都道府県、性別、メッセージ、動画許可、お約束）
 * - CompanionAddSection: 友人追加部分（友人リスト、追加フォーム、Twitter検索）
 * - FormButtonsSection: フォームボタン部分（キャンセル、送信）
 */

import { View } from "react-native";
import { color } from "@/theme/tokens";
import { SectionHeader, type FormGender } from "@/components/ui";
import type { Companion, LookedUpProfile } from "../types";
import { FormInputSection } from "./FormInputSection";
import { CompanionAddSection } from "./CompanionAddSection";
import { FormButtonsSection } from "./FormButtonsSection";
import { eventDetailCopy } from "@/constants/copy";

interface ParticipationFormSectionProps {
  // User
  user: {
    id?: number;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    followersCount?: number | null;
  } | null;
  login: () => void;
  
  // Form state
  message: string;
  setMessage: (value: string) => void;
  prefecture: string;
  setPrefecture: (value: string) => void;
  gender: FormGender;
  setGender: (value: FormGender) => void;
  allowVideoUse: boolean;
  setAllowVideoUse: (value: boolean) => void;
  showPrefectureList: boolean;
  setShowPrefectureList: (value: boolean) => void;
  
  // Companion state
  companions: Companion[];
  showAddCompanionForm: boolean;
  setShowAddCompanionForm: (value: boolean) => void;
  newCompanionName: string;
  setNewCompanionName: (value: string) => void;
  newCompanionTwitter: string;
  setNewCompanionTwitter: (value: string) => void;
  isLookingUpTwitter: boolean;
  lookupError: string | null;
  lookedUpProfile: LookedUpProfile | null;
  setLookedUpProfile: (value: LookedUpProfile | null) => void;
  setLookupError: (value: string | null) => void;
  
  // Actions
  onSubmit: () => void;
  onCancel: () => void;
  onAddCompanion: () => void;
  onRemoveCompanion: (id: string) => void;
  onLookupTwitterProfile: (input: string) => Promise<void>;
  
  // State
  isSubmitting: boolean;
}

export function ParticipationFormSection({
  user,
  login,
  message,
  setMessage,
  prefecture,
  setPrefecture,
  gender,
  setGender,
  allowVideoUse,
  setAllowVideoUse,
  showPrefectureList,
  setShowPrefectureList,
  companions,
  showAddCompanionForm,
  setShowAddCompanionForm,
  newCompanionName,
  setNewCompanionName,
  newCompanionTwitter,
  setNewCompanionTwitter,
  isLookingUpTwitter,
  lookupError,
  lookedUpProfile,
  setLookedUpProfile,
  setLookupError,
  onSubmit,
  onCancel,
  onAddCompanion,
  onRemoveCompanion,
  onLookupTwitterProfile,
  isSubmitting,
}: ParticipationFormSectionProps) {
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <SectionHeader title={eventDetailCopy.section.participation} style={{ paddingHorizontal: 0, paddingVertical: 0, marginBottom: 16 }} />

      {/* フォーム入力部分 */}
      <FormInputSection
        user={user}
        login={login}
        message={message}
        setMessage={setMessage}
        prefecture={prefecture}
        setPrefecture={setPrefecture}
        gender={gender}
        setGender={setGender}
        allowVideoUse={allowVideoUse}
        setAllowVideoUse={setAllowVideoUse}
        showPrefectureList={showPrefectureList}
        setShowPrefectureList={setShowPrefectureList}
      />

      {/* 友人追加セクション */}
      <CompanionAddSection
        companions={companions}
        showAddCompanionForm={showAddCompanionForm}
        setShowAddCompanionForm={setShowAddCompanionForm}
        newCompanionName={newCompanionName}
        setNewCompanionName={setNewCompanionName}
        newCompanionTwitter={newCompanionTwitter}
        setNewCompanionTwitter={setNewCompanionTwitter}
        isLookingUpTwitter={isLookingUpTwitter}
        lookupError={lookupError}
        lookedUpProfile={lookedUpProfile}
        setLookedUpProfile={setLookedUpProfile}
        setLookupError={setLookupError}
        onAddCompanion={onAddCompanion}
        onRemoveCompanion={onRemoveCompanion}
        onLookupTwitterProfile={onLookupTwitterProfile}
      />

      {/* ボタン */}
      <FormButtonsSection
        prefecture={prefecture}
        gender={gender}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </View>
  );
}
