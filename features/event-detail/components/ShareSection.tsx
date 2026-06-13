/**
 * ShareSection Component
 * シェア・リマインダーボタン、参加表明ボタン
 */

import { View, Text, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "@/theme/tokens";
import { useColors } from "@/hooks/use-colors";
import { ReminderButton } from "@/components/molecules/reminder-button";

interface ShareSectionProps {
  challengeId: number;
  challengeTitle: string;
  eventDate?: string;
  onShare: () => void;
  onTwitterShare: () => void;
  onShowForm: () => void;
}

export function ShareSection({
  challengeId,
  challengeTitle,
  eventDate,
  onShare,
  onTwitterShare,
  onShowForm,
}: ShareSectionProps) {
  const colors = useColors();
  
  return (
    <View style={{ gap: 12, marginTop: 16 }}>
      {/* シェア・Xシェアボタン */}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Pressable
          onPress={onShare}
          style={{
            flex: 1,
            backgroundColor: color.surface,
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: color.border,
          }}
        >
          <MaterialIcons name="share" size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 6 }}>シェア</Text>
        </Pressable>
        <Pressable
          onPress={onTwitterShare}
          style={{
            flex: 1,
            backgroundColor: "#000",
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>𝕏</Text>
          <Text style={{ color: colors.foreground, fontSize: 14, marginLeft: 6 }}>Xでシェア</Text>
        </Pressable>
      </View>
      
      {/* リマインダーボタン */}
      {eventDate && (
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <ReminderButton
            challengeId={challengeId}
            challengeTitle={challengeTitle}
            eventDate={new Date(eventDate)}
          />
        </View>
      )}
      
      {/* 参加表明ボタン */}
      <Pressable
        onPress={onShowForm}
        style={{
          flex: 2,
          borderRadius: 12,
          padding: 16,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[color.accentPrimary, color.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        />
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "bold" }}>
          参加表明する
        </Text>
      </Pressable>
    </View>
  );
}
