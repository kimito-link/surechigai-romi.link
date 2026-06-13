/**
 * 設定リンクアイテムコンポーネント
 * v6.23: 新UIコンポーネント（Button）を使用
 */
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { mypageUI, mypageText, mypageFont } from "../ui/theme/tokens";
import { Button } from "@/components/ui/button";

interface SettingsLinkItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
}

export function SettingsLinkItem({ 
  icon, 
  iconColor, 
  title, 
  description, 
  onPress 
}: SettingsLinkItemProps) {
  const colors = useColors();
  
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      fullWidth
      style={{
        backgroundColor: mypageUI.cardBg,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: mypageUI.cardBorder,
        justifyContent: "flex-start",
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: iconColor,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <MaterialIcons name={icon} size={24} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: mypageFont.title, fontWeight: "bold" }}>
          {title}
        </Text>
        <Text style={{ color: mypageText.muted, fontSize: mypageFont.meta }}>
          {description}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={mypageText.muted} />
    </Button>
  );
}
