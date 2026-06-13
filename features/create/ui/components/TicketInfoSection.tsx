/**
 * チケット情報セクション
 * 
 * 前売り券・当日券・購入URLの入力UI
 */

import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { createUI, createText, createFont } from "../theme/tokens";
import { UndecidedOption } from "./create-challenge-form/UndecidedOption";
import { Input } from "@/components/ui";

interface TicketInfoSectionProps {
  ticketPresale: string;
  ticketDoor: string;
  ticketUrl: string;
  onTicketPresaleChange: (value: string) => void;
  onTicketDoorChange: (value: string) => void;
  onTicketUrlChange: (value: string) => void;
}

export function TicketInfoSection({
  ticketPresale,
  ticketDoor,
  ticketUrl,
  onTicketPresaleChange,
  onTicketDoorChange,
  onTicketUrlChange,
}: TicketInfoSectionProps) {
  const colors = useColors();
  const isUndecided = ticketPresale === "-1" && ticketDoor === "-1";

  const handleToggleUndecided = () => {
    if (isUndecided) {
      onTicketPresaleChange("");
      onTicketDoorChange("");
    } else {
      onTicketPresaleChange("-1");
      onTicketDoorChange("-1");
      onTicketUrlChange("");
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: createUI.inputBorder,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <MaterialIcons name="confirmation-number" size={20} color={createText.accent} />
        <Text style={{ color: colors.foreground, fontSize: createFont.title, fontWeight: "600", marginLeft: 8 }}>
          チケット情報（任意）
        </Text>
      </View>

      <UndecidedOption
        checked={isUndecided}
        onToggle={handleToggleUndecided}
        marginBottom={12}
        note="※ 決まり次第、後から編集できます"
      />

      {!isUndecided && (
        <>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: createFont.meta, marginBottom: 4 }}>
                前売り券
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Input
                  value={ticketPresale}
                  onChangeText={onTicketPresaleChange}
                  placeholder="3000"
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                />
                <Text style={{ color: colors.muted, fontSize: createFont.body, marginLeft: 8 }}>円</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: createFont.meta, marginBottom: 4 }}>
                当日券
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Input
                  value={ticketDoor}
                  onChangeText={onTicketDoorChange}
                  placeholder="3500"
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                />
                <Text style={{ color: colors.muted, fontSize: createFont.body, marginLeft: 8 }}>円</Text>
              </View>
            </View>
          </View>

          <Input
            label="チケット購入URL"
            value={ticketUrl}
            onChangeText={onTicketUrlChange}
            placeholder="https://tiget.net/events/..."
            containerStyle={{ marginBottom: 0 }}
          />
        </>
      )}
    </View>
  );
}
