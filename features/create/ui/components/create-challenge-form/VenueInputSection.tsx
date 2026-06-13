// features/create/ui/components/create-challenge-form/VenueInputSection.tsx
// 開催場所入力セクション

import { View } from "react-native";
import { Input } from "@/components/ui";
import { UndecidedOption } from "./UndecidedOption";
import type { VenueInputSectionProps } from "./types";

/**
 * 開催場所入力セクション
 * 「まだ決まっていない」オプション付き
 */
export function VenueInputSection({ value, onChange }: VenueInputSectionProps) {
  const isUndecided = value === "まだ決まっていない";

  return (
    <View>
      <Input
        label="開催場所（任意）"
        value={isUndecided ? "" : value}
        onChangeText={onChange}
        placeholder="例: 渋谷○○ホール / YouTube / ミクチャ"
        containerStyle={{ marginBottom: 8 }}
        disabled={isUndecided}
      />

      <UndecidedOption
        checked={isUndecided}
        onToggle={() => onChange("まだ決まっていない")}
        note="※ 決まり次第、後から編集できます"
      />
    </View>
  );
}
