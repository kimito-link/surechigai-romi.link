/**
 * PrefectureSelector Component (Event Detail)
 * イベント詳細画面用の都道府県選択ラッパー
 * 
 * 汎用コンポーネント components/ui/prefecture-selector.tsx を使用
 */

import { PrefectureSelector as BasePrefectureSelector } from "@/components/ui";

interface PrefectureSelectorProps {
  prefecture: string;
  setPrefecture: (value: string) => void;
  showPrefectureList: boolean;
  setShowPrefectureList: (value: boolean) => void;
}

export function PrefectureSelector({
  prefecture,
  setPrefecture,
  showPrefectureList,
  setShowPrefectureList,
}: PrefectureSelectorProps) {
  return (
    <BasePrefectureSelector
      value={prefecture}
      onChange={setPrefecture}
      isOpen={showPrefectureList}
      onOpenChange={setShowPrefectureList}
      label="都道府県"
      required
      placeholder="選択してください"
    />
  );
}
