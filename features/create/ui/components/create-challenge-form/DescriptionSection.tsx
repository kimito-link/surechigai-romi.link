// features/create/ui/components/create-challenge-form/DescriptionSection.tsx
// チャレンジ説明入力セクション

import { Input } from "@/components/ui";
import type { DescriptionSectionProps } from "./types";

/**
 * チャレンジ説明入力セクション
 * 複数行入力対応
 */
export function DescriptionSection({ value, onChange }: DescriptionSectionProps) {
  return (
    <Input
      label="チャレンジ説明（任意）"
      value={value}
      onChangeText={onChange}
      placeholder="チャレンジの詳細を書いてね"
      multiline
      numberOfLines={4}
      inputStyle={{ minHeight: 100 }}
    />
  );
}
