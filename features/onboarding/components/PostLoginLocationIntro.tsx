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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { POST_LOGIN_LOCATION_INTRO_KEY } from "@/features/onboarding/constants";
import { color, palette } from "@/theme/tokens";

const RINKU_HERO = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

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
  onAllow: () => void | Promise<void>;
  onLater: () => void | Promise<void>;
};

export function PostLoginLocationIntro({
  visible,
  onAllow,
  onLater,
}: PostLoginLocationIntroProps) {
  const [busy, setBusy] = useState(false);

  const handleAllow = useCallback(async () => {
    setBusy(true);
    try {
      await markPostLoginLocationIntroDone();
      await onAllow();
    } finally {
      setBusy(false);
    }
  }, [onAllow]);

  const handleLater = useCallback(async () => {
    await markPostLoginLocationIntroDone();
    await onLater();
  }, [onLater]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleLater}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityRole="alert">
          <Image source={RINKU_HERO} style={styles.hero} contentFit="contain" />
          <View style={styles.titleRow}>
            <MaterialIcons name="my-location" size={20} color={palette.kimitoBlue} />
            <Text style={styles.title}>位置情報を使います</Text>
          </View>
          <Text style={styles.body}>あとで行ける精度で、この場所を保存するためです</Text>

          <Pressable
            onPress={handleAllow}
            disabled={busy}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, busy && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="位置情報を許可して記録"
          >
            {busy ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.primaryBtnText}>位置情報を許可して記録</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleLater}
            disabled={busy}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>今はしない</Text>
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
    width: 96,
    height: 96,
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
  secondaryBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: color.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});
