import { View, Text } from "react-native";

interface DetailRowProps {
  label: string;
  value: string | number;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-foreground font-medium">{value}</Text>
    </View>
  );
}
