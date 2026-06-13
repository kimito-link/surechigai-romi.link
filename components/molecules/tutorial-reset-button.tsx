import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { color, palette } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTutorial } from "@/lib/tutorial-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

/**
 * チュートリアル再表示ボタン
 * 設定画面に配置して、チュートリアルを再度見られるようにする
 */
export function TutorialResetButton() {
  const colors = useColors();
  const { resetTutorial, showTypeSelector, isCompleted } = useTutorial();

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (Platform.OS === "web") {
      // Web: confirmダイアログ
      if (confirm("チュートリアルを最初から見ますか？")) {
        await resetTutorial();
        showTypeSelector();
      }
    } else {
      // Native: Alertダイアログ
      Alert.alert(
        "チュートリアルを見る",
        "チュートリアルを最初から見ますか？",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "見る",
            onPress: async () => {
              await resetTutorial();
              showTypeSelector();
            },
          },
        ]
      );
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="school" size={24} color={color.hostAccentLegacy} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          チュートリアルを見る
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isCompleted ? "もう一度最初から見る" : "使い方を学ぶ"}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.orange500 + "1A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
