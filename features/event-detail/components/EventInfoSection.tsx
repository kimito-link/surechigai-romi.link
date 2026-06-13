/**
 * EventInfoSection Component
 * イベントの基本情報（日時、会場、説明）
 */

import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";

interface EventInfoSectionProps {
  formattedDate: string;
  venue?: string;
  description?: string;
}

export function EventInfoSection({ formattedDate, venue, description }: EventInfoSectionProps) {
  const colors = useColors();
  
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
        <MaterialIcons name="event" size={20} color={color.hostAccentLegacy} />
        <Text style={{ color: colors.foreground, fontSize: 16, marginLeft: 8 }}>
          {formattedDate}
        </Text>
      </View>

      {venue && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <MaterialIcons name="place" size={20} color={color.hostAccentLegacy} />
          <Text style={{ color: colors.foreground, fontSize: 16, marginLeft: 8 }}>
            {venue}
          </Text>
        </View>
      )}

      {description && (
        <Text style={{ color: color.textSecondary, fontSize: 15, lineHeight: 22 }}>
          {description}
        </Text>
      )}
    </View>
  );
}
