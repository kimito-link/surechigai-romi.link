/**
 * FormInputSection Component
 * フォーム入力部分（都道府県、性別、メッセージ、動画許可、お約束）
 * 
 * 分割されたサブコンポーネント:
 * - UserInfoSection: ユーザー情報表示・ログイン促進
 * - PrefectureSelector: 都道府県選択ドロップダウン
 * - GenderSelector: 性別選択ラジオボタン
 * - TermsAndPermissions: お約束・動画許可・メッセージ入力
 */

import { View } from "react-native";
import type { FormGender } from "@/components/ui";
import {
  UserInfoSection,
  PrefectureSelector,
  GenderSelector,
  TermsAndPermissions,
} from "./form-inputs";

interface FormInputSectionProps {
  // User info display
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
}

export function FormInputSection({
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
}: FormInputSectionProps) {
  return (
    <View>
      {/* ユーザー情報表示 / ログイン促進 */}
      <UserInfoSection user={user} login={login} />

      {/* 都道府県選択 */}
      <PrefectureSelector
        prefecture={prefecture}
        setPrefecture={setPrefecture}
        showPrefectureList={showPrefectureList}
        setShowPrefectureList={setShowPrefectureList}
      />

      {/* 性別選択 */}
      <GenderSelector gender={gender} setGender={setGender} />

      {/* メッセージ・お約束・動画許可 */}
      <TermsAndPermissions
        message={message}
        setMessage={setMessage}
        allowVideoUse={allowVideoUse}
        setAllowVideoUse={setAllowVideoUse}
      />
    </View>
  );
}
