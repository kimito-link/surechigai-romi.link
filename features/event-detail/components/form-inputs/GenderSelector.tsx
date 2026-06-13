/**
 * GenderSelector Component (Event Detail)
 * イベント詳細画面用の性別選択ラッパー
 * 
 * 汎用コンポーネント components/ui/gender-selector.tsx を使用
 */

import { GenderSelector as BaseGenderSelector, type FormGender } from "@/components/ui";

interface GenderSelectorProps {
  gender: FormGender;
  setGender: (value: FormGender) => void;
}

export function GenderSelector({ gender, setGender }: GenderSelectorProps) {
  return (
    <BaseGenderSelector
      value={gender}
      onChange={setGender}
      label="性別"
      required
      errorMessage="性別を選択してください"
    />
  );
}
