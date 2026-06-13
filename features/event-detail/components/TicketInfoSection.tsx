/**
 * TicketInfoSection Component
 * チケット情報（前売り、当日、購入リンク）
 */

import { View, Text, Pressable } from "react-native";
import { openTicketSite } from "@/lib/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

interface TicketInfoSectionProps {
  ticketPresale?: number;
  ticketDoor?: number;
  ticketUrl?: string;
}

export function TicketInfoSection({ ticketPresale, ticketDoor, ticketUrl }: TicketInfoSectionProps) {
  const colors = useColors();
  
  // チケット情報がない場合は何も表示しない
  if (!ticketPresale && !ticketDoor && !ticketUrl) {
    return null;
  }
  
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <MaterialIcons name="confirmation-number" size={20} color={color.accentPrimary} />
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
          チケット情報
        </Text>
      </View>

      {ticketPresale && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: color.textSecondary, fontSize: 14 }}>前売り</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
            ¥{ticketPresale.toLocaleString()}
          </Text>
        </View>
      )}

      {ticketDoor && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: color.textSecondary, fontSize: 14 }}>当日</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
            ¥{ticketDoor.toLocaleString()}
          </Text>
        </View>
      )}

      {ticketUrl && (
        <Pressable
          onPress={() => openTicketSite(ticketUrl)}
          style={{
            backgroundColor: color.accentPrimary,
            borderRadius: 12,
            padding: 14,
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="open-in-new" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "bold", marginLeft: 8 }}>
            チケットを購入する
          </Text>
        </Pressable>
      )}
    </View>
  );
}
