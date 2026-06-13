import { PropsWithChildren, useState } from "react";
import { Text, Pressable, View, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { IconSymbol } from "@/components/atoms/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen((value) => !value);
  };

  return (
    <View className="bg-background">
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          { flexDirection: "row", alignItems: "center", gap: 6 },
          pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
        ]}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={colors.icon}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </Pressable>
      {isOpen && <View className="mt-1.5 ml-6">{children}</View>}
    </View>
  );
}
