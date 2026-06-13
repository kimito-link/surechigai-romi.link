import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
  showSign?: boolean;
}

export function StatCard({
  label,
  value,
  color,
  icon,
  showSign,
}: StatCardProps) {
  const displayValue = showSign && value > 0 ? `+${value}` : value.toString();

  return (
    <View className="bg-background rounded-lg p-3 min-w-[100px]">
      <View className="flex-row items-center mb-1">
        {icon && (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={color}
            style={{ marginRight: 4 }}
          />
        )}
        <Text className="text-xs text-muted">{label}</Text>
      </View>
      <Text className="text-xl font-bold" style={{ color }}>
        {displayValue}
      </Text>
    </View>
  );
}
