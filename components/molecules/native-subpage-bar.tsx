/**
 * ネイティブ（iOS / Android）のタブ外画面の上に出す「戻る＋画面名」の帯。
 *
 * ★2026-11-13: ネイティブでは ScreenContainer がヘッダーを描かない（Web の固定ヘッダーは
 *   web 専用）うえ、Stack も headerShown:false のため、メニューから開いた「訪問申告」や
 *   マイページから開いた「プレミアム」などに戻るボタンが1つも無かった。
 *   iPhone では画面端スワイプでしか戻れず、Android では戻るキー頼みだった。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@/lib/icons/material-icons";
import { navigate, navigateBack } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";

export function goBackOrHome() {
  if (router.canGoBack()) navigateBack();
  else navigate.toHome();
}

export function NativeSubpageBar({ title }: { title: string }) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={goBackOrHome}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={palette.kimitoBlue} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 8,
    backgroundColor: palette.kimitoBlueSoft,
    borderBottomWidth: 1,
    borderBottomColor: palette.kimitoBorderSoft,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    marginLeft: 4,
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
});
