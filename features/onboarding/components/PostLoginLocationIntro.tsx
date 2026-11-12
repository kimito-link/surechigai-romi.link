import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { POST_LOGIN_LOCATION_INTRO_KEY } from "@/features/onboarding/constants";
import { color, palette } from "@/theme/tokens";

const RINKU_HERO = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

const LOCATION_INTRO_STEPS = [
  {
    icon: "my-location" as const,
    label: "正確な現在地を測位（±数m〜数十m）",
  },
  {
    icon: "place" as const,
    label: "あとで行ける精度で地図に足あとを保存",
  },
  {
    icon: "mail-outline" as const,
    label: "同じ場所を通った人とすれ違ひ通信",
  },
] as const;

export async function hasCompletedPostLoginLocationIntro(): Promise<boolean> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(POST_LOGIN_LOCATION_INTRO_KEY) === "true") {
        return true;
      }
    } catch {
      // AsyncStorage fallback
    }
  }
  return (await AsyncStorage.getItem(POST_LOGIN_LOCATION_INTRO_KEY)) === "true";
}

async function markPostLoginLocationIntroDone(): Promise<void> {
  await AsyncStorage.setItem(POST_LOGIN_LOCATION_INTRO_KEY, "true");
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(POST_LOGIN_LOCATION_INTRO_KEY, "true");
  }
}

type PostLoginLocationIntroProps = {
  visible: boolean;
  /** 「次へ」で閉じたあと、OS の位置情報ダイアログへ進む */
  onNext: () => void | Promise<void>;
};

/**
 * OS の位置情報ダイアログの前に出す説明画面。
 *
 * ★App Store Guideline 5.1.1(iv)（2026-11-12 build 551 で却下）:
 * - ボタン文言は「次へ」「続ける」にする（「許可して記録」のような許可を促す語は不可）
 * - 説明画面を閉じて許可を先送りする導線（「今はしない」等）を置かない。
 *   説明のあとはいつも OS のダイアログへ進ませ、許可するかは OS 側で利用者が決める。
 * スキップボタンを戻したり、ボタン文言を「許可」系に変えたりしないこと。
 */
export function PostLoginLocationIntro({
  visible,
  onNext,
}: PostLoginLocationIntroProps) {
  const [busy, setBusy] = useState(false);

  const handleNext = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setBusy(true);
    try {
      await markPostLoginLocationIntroDone();
      await onNext();
    } finally {
      setBusy(false);
    }
  }, [onNext]);

  // Android の戻るキーでも OS ダイアログへ進める（説明だけ見て閉じる経路を作らない）。
  const handleRequestClose = useCallback(() => {
    if (!busy) void handleNext();
  }, [busy, handleNext]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleRequestClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityRole="alert">
          <Image source={RINKU_HERO} style={styles.hero} contentFit="contain" />
          <View style={styles.titleRow}>
            <MaterialIcons name="my-location" size={20} color={palette.kimitoBlue} />
            <Text style={styles.title}>位置情報を使います</Text>
          </View>
          <Text style={styles.body}>あとで行ける精度で、この場所を保存するためです</Text>

          <View style={styles.stepsWrap}>
            {LOCATION_INTRO_STEPS.map((step) => (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepIconWrap}>
                  <MaterialIcons name={step.icon} size={16} color={palette.kimitoBlue} />
                </View>
                <Text style={styles.stepText}>{step.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.reassurance}>
            このあと端末の確認画面が出ます。許可するかどうかはそこで選べます。
            記録はボタンを押した時だけで、1タップでいつでも一時停止できます。
          </Text>

          <Pressable
            onPress={handleNext}
            disabled={busy}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, busy && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="次へ"
          >
            {busy ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.primaryBtnText}>次へ</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 20,
    gap: 12,
  },
  hero: {
    width: 88,
    height: 88,
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  title: {
    color: palette.kimitoBlue,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: color.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  stepsWrap: {
    backgroundColor: palette.kimitoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.kimitoBlueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  reassurance: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  primaryBtn: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: palette.kimitoBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
