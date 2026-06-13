// features/create/ui/components/create-challenge-form/ExternalUrlSection.tsx
// 外部URL入力セクション

import { Input } from "@/components/ui";
import type { ExternalUrlSectionProps } from "./types";

/**
 * 外部URL入力セクション
 * YouTubeプレミア公開URL等の入力
 */
export function ExternalUrlSection({ value, onChange }: ExternalUrlSectionProps) {
  return (
    <Input
      label="外部URL（任意）"
      value={value}
      onChangeText={onChange}
      placeholder="YouTubeプレミア公開URL等"
    />
  );
}
