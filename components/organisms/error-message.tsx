import { View, Text, Pressable, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RetryButton } from "@/components/ui/retry-button";
import * as Haptics from "expo-haptics";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  type?: "error" | "warning" | "info";
}

const typeConfig = {
  error: {
    bgColor: palette.red500 + "1A", // 10% opacity
    borderColor: color.danger,
    iconColor: color.danger,
    icon: "error-outline" as const,
  },
  warning: {
    bgColor: palette.gold + "1A", // 10% opacity
    borderColor: color.warning,
    iconColor: color.warning,
    icon: "warning" as const,
  },
  info: {
    bgColor: palette.blue500 + "1A", // 10% opacity
    borderColor: color.info,
    iconColor: color.info,
    icon: "info-outline" as const,
  },
};

const triggerHaptic = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export function ErrorMessage({ message, onRetry, type = "error" }: ErrorMessageProps) {
  const config = typeConfig[type];
  
  return (
    <View
      style={{
        backgroundColor: config.bgColor,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: config.borderColor,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <MaterialIcons name={config.icon} size={24} color={config.iconColor} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: color.textWhite, fontSize: 14, lineHeight: 20 }}>
          {message}
        </Text>
      </View>
      {onRetry && (
        <View style={{ marginLeft: 12 }}>
          <RetryButton 
            onPress={onRetry} 
            size="sm"
            label="再試行"
          />
        </View>
      )}
    </View>
  );
}

// ネットワークエラー用の特化コンポーネント
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={{ padding: 20, alignItems: "center" }}>
      <MaterialIcons name="wifi-off" size={64} color={color.textSubtle} />
      <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
        接続エラー
      </Text>
      <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center", marginBottom: 20 }}>
        ネットワーク接続を確認してください
      </Text>
      {onRetry && (
        <Pressable
          onPress={() => {
            triggerHaptic();
            onRetry();
          }}
          style={({ pressed }) => [
            {
              minHeight: 48,
              paddingHorizontal: 32,
              paddingVertical: 14,
              backgroundColor: color.hostAccentLegacy,
              borderRadius: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            },
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
        >
          <MaterialIcons name="refresh" size={20} color={color.textWhite} />
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
            再読み込み
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// 空の状態用コンポーネント
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <MaterialIcons name={icon} size={64} color={color.textSubtle} />
      <Text style={{ color: color.textWhite, fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ color: color.textMuted, fontSize: 14, textAlign: "center" }}>
        {message}
      </Text>
      {action && (
        <Pressable
          onPress={() => {
            triggerHaptic();
            action.onPress();
          }}
          style={({ pressed }) => [
            {
              marginTop: 20,
              minHeight: 48,
              paddingHorizontal: 24,
              paddingVertical: 14,
              backgroundColor: color.hostAccentLegacy,
              borderRadius: 24,
            },
            pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={{ color: color.textWhite, fontSize: 16, fontWeight: "bold" }}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
