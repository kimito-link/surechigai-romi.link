// components/atoms/floating-action-button.tsx
// 後方互換性のため、components/ui/buttonから再エクスポート

import { Pressable, StyleSheet, View, Text, Platform } from "react-native";
import { useCallback, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { color, palette } from "@/theme/tokens";

export { FAB as FloatingActionButton, type FABProps } from "@/components/ui/button";

interface ExpandableFABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface ExpandableFABProps {
  actions: ExpandableFABAction[];
  mainIcon?: string;
  mainColor?: string;
}

// アクションアイテムコンポーネント（Hooksをトップレベルで呼び出す）
function ActionItem({
  action,
  index,
  expansion,
  onPress,
}: {
  action: ExpandableFABAction;
  index: number;
  expansion: SharedValue<number>;
  onPress: (action: ExpandableFABAction) => void;
}) {
  const actionStyle = useAnimatedStyle(() => ({
    opacity: expansion.value,
    transform: [
      { translateY: interpolate(expansion.value, [0, 1], [0, -(60 * (index + 1))]) },
      { scale: expansion.value },
    ],
  }));

  return (
    <Animated.View style={[styles.actionItem, actionStyle]}>
      <View style={styles.actionLabelContainer}>
        <Text style={styles.actionLabel}>{action.label}</Text>
      </View>
      <Pressable
        onPress={() => onPress(action)}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor: action.color || color.textSubtle },
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        <MaterialIcons name={action.icon as any} size={20} color={color.textWhite} />
      </Pressable>
    </Animated.View>
  );
}

export function ExpandableFAB({
  actions,
  mainIcon = "add",
  mainColor = color.accentPrimary,
}: ExpandableFABProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const expansion = useSharedValue(0);

  const toggleExpand = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 0 : 45, { damping: 15, stiffness: 300 });
    expansion.value = withTiming(expanded ? 0 : 1, { duration: 200 });
  }, [expanded, rotation, expansion]);

  const handleActionPress = useCallback((action: ExpandableFABAction) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    action.onPress();
    setExpanded(false);
    rotation.value = withSpring(0, { damping: 15, stiffness: 300 });
    expansion.value = withTiming(0, { duration: 200 });
  }, [rotation, expansion]);

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.expandableContainer}>
      {actions.map((action, index) => (
        <ActionItem
          key={index}
          action={action}
          index={index}
          expansion={expansion}
          onPress={handleActionPress}
        />
      ))}

      <Animated.View style={mainButtonStyle}>
        <Pressable
          onPress={toggleExpand}
          style={({ pressed }) => [
            styles.mainButton,
            { backgroundColor: mainColor },
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
        >
          <MaterialIcons name={mainIcon as any} size={28} color={color.textWhite} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  expandableContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    alignItems: "flex-end",
    zIndex: 100,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  actionLabelContainer: {
    backgroundColor: color.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  actionLabel: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ExpandableFAB;
