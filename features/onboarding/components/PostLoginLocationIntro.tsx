/**
 * ログイン後の位置情報許可 — surechigai-nico 型の専用1画面
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { POST_LOGIN_LOCATION_INTRO_KEY } from "@/features/onboarding/constants";
import { getCurrentLocation } from "@/lib/get-current-location";
import { useAuth } from "@/hooks/use-auth";
import { color, palette } from "@/theme/tokens";

const RINKU_HERO = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

function readIntroDoneSync(): boolean | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(POST_LOGIN_LOCATION_INTRO_KEY) === "true";
    } catch {
      return null;
    }
  }
  return null;
}

export function PostLoginLocationIntro() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      setVisible(false);
      return;
    }

    const syncDone = readIntroDoneSync();
    if (syncDone) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(POST_LOGIN_LOCATION_INTRO_KEY);
        if (cancelled) return;
        if (stored === "true") {
          setHydrated(true);
          return;
        }
        setVisible(true);
        setHydrated(true);
      } catch {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, isAuthenticated]);

  const markDone = useCallback(async () => {
    await AsyncStorage.setItem(POST_LOGIN_LOCATION_INTRO_KEY, "true");
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(POST_LOGIN_LOCATION_INTRO_KEY, "true");
    }
    setVisible(false);
  }, []);

  const handleAllow = useCallback(async () => {
    setBusy(true);
    try {
      await getCurrentLocation();
      await markDone();
    } catch {
      await markDone();
    } finally {
      setBusy(false);
    }
  }, [markDone]);

  const handleLater = useCallback(async () => {
    await markDone();
  }, [markDone]);

  if (!hydrated || !visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={handleLater}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Image source={RINKU_HERO} style={styles.hero} contentFit="contain" />

          <View style={styles.iconRow}>
            <MaterialIcons name="my-location" size={20} color={palette.teal500} />
            <Text style={styles.eyebrow}>チェックインの準備</Text>
          </View>

          <Text style={styles.title}>正確な場所を残して、{"\n"}あとでたどれる</Text>
          <Text style={styles.body}>
            位置情報はチェックインと軌跡の表示に使います。すれ違いマッチング用のグリッド丸めとは別に、思い出の場所へ戻れる精度で保存します。
          </Text>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              プライバシーは移動専用の X アカウント利用で調整できます。自宅付近は夜間チェックインから自動マスクします。
            </Text>
          </View>

          <Pressable
            onPress={handleAllow}
            disabled={busy}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, busy && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="位置情報を許可する"
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>位置情報を許可する</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleLater}
            disabled={busy}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>位置はチェックイン時に許可できます</Text>
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
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
    padding: 22,
    gap: 12,
  },
  hero: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.kimitoOrange,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.kimitoBlue,
    textAlign: "center",
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: color.textSecondary,
    textAlign: "center",
  },
  noteBox: {
    backgroundColor: palette.kimitoBlueSoft,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.kimitoBorderSoft,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textMuted,
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
    fontWeight: "600",
  },
});
