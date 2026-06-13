/**
 * InviteButton Component
 * 友達を招待するボタン
 * v6.38: navigateに移行
 */

import { Text, Pressable } from "react-native";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

interface InviteButtonProps {
  challengeId: number;
}

export function InviteButton({ challengeId }: InviteButtonProps) {
  const colors = useColors();
  
  return (
    <Pressable
      onPress={() => navigate.toInvite(challengeId)}
      style={{
        backgroundColor: color.hostAccentLegacy,
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialIcons name="person-add" size={20} color={colors.foreground} />
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
        友達を招待する
      </Text>
    </Pressable>
  );
}
