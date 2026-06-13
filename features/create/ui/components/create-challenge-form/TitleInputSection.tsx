// features/create/ui/components/create-challenge-form/TitleInputSection.tsx
// チャレンジ名入力セクション

import { View } from "react-native";
import { Input } from "@/components/ui";
import { InlineValidationError } from "@/components/molecules/inline-validation-error";
import type { TitleInputSectionProps } from "./types";

/**
 * チャレンジ名入力セクション
 * バリデーションエラー表示付き
 */
export function TitleInputSection({
  value,
  onChange,
  showValidationError,
  inputRef,
}: TitleInputSectionProps) {
  const hasError = showValidationError && !value.trim();

  return (
    <View ref={inputRef}>
      <Input
        label="チャレンジ名 *"
        value={value}
        onChangeText={onChange}
        placeholder="例: ○○ワンマンライブ動員チャレンジ"
        containerStyle={{ marginBottom: hasError ? 0 : 16 }}
      />
      {/* キャラクター表示付きエラー */}
      <InlineValidationError
        message="チャレンジ名を入れてね！"
        visible={hasError}
        character="rinku"
      />
    </View>
  );
}
