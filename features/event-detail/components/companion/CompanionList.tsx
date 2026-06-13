/**
 * CompanionList Component
 * 友人リスト（登録済み友人の表示・削除）
 */

import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import type { Companion } from "../../types";

interface CompanionListProps {
  companions: Companion[];
  onRemoveCompanion: (id: string) => void;
}

export function CompanionList({ companions, onRemoveCompanion }: CompanionListProps) {
  if (companions.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 8 }}>
      {companions.map((companion) => (
        <CompanionItem
          key={companion.id}
          companion={companion}
          onRemove={() => onRemoveCompanion(companion.id)}
        />
      ))}
    </View>
  );
}

// 友人アイテム
function CompanionItem({
  companion,
  onRemove,
}: {
  companion: Companion;
  onRemove: () => void;
}) {
  const colors = useColors();
  
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: companion.profileImage ? color.twitter : color.border,
      }}
    >
      {/* アバター */}
      <CompanionAvatar
        profileImage={companion.profileImage}
        displayName={companion.displayName}
      />

      {/* 情報 */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: "600" }}>
          {companion.displayName}
        </Text>
        {companion.twitterUsername && (
          <Text style={{ color: color.twitter, fontSize: 12 }}>
            @{companion.twitterUsername}
          </Text>
        )}
      </View>

      {/* 削除ボタン */}
      <Pressable onPress={onRemove}>
        <MaterialIcons name="close" size={20} color={color.textHint} />
      </Pressable>
    </View>
  );
}

// アバター
function CompanionAvatar({
  profileImage,
  displayName,
}: {
  profileImage?: string;
  displayName: string;
}) {
  const colors = useColors();

  if (profileImage) {
    return (
      <Image
        source={{ uri: profileImage }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color.accentPrimary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
