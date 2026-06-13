// features/create/ui/components/create-challenge-form/UserInfoSection.tsx
// ログイン済みユーザー情報表示セクション

import { View } from "react-native";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { TwitterUserCard } from "@/components/molecules/twitter-user-card";
import type { UserInfoSectionProps } from "./types";

/**
 * ユーザー情報表示セクション
 * ログイン済みユーザーの情報を表示
 */
export function UserInfoSection({ user }: UserInfoSectionProps) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <TwitterUserCard
        user={{
          name: user.name || "",
          username: user.username || "",
          profileImage: user.profileImage || "",
          followersCount: user.followersCount ?? undefined,
          description: user.description ?? undefined,
        }}
        showFollowers={true}
        showDescription={true}
      />
    </View>
  );
}
