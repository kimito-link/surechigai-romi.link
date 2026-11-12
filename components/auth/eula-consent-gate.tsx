/**
 * ログイン・登録の前に利用規約（EULA）への同意を求めるゲート。
 *
 * ★App Store Guideline 1.2（2026-11-12 build 551 で却下）:
 * UGC（ひとこと・場所メモ・プロフィール）を扱うアプリは、登録・ログインの前に
 * 利用規約への同意を求め、その規約で「不適切なコンテンツと迷惑な利用者を一切容認しない」
 * ことを明示しなければならない。ここが /sign-in のログインボタンの手前に入る唯一の関門。
 * ネイティブのログイン導線はすべて /sign-in に集約されている（hooks/use-login-guide.ts）。
 *
 * - 同意するまで子要素（ログインボタン群）は押せない（pointerEvents="none"）。
 * - 同意は端末に保存し、次回以降はチェック済みで表示する（規約を改定したら KEY の版を上げる）。
 * - 規約本文は app/terms.tsx（第4章「不適切なコンテンツと迷惑な利用者の禁止」）。
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigate } from "@/lib/navigation";
import MaterialIcons from "@/lib/icons/material-icons";
import { palette } from "@/theme/tokens";

export const EULA_ACCEPTED_KEY = "@surechigai_eula_accepted_2026_11_12";

function readAcceptedSync(): boolean {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(EULA_ACCEPTED_KEY) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

async function readAccepted(): Promise<boolean> {
  if (readAcceptedSync()) return true;
  try {
    return (await AsyncStorage.getItem(EULA_ACCEPTED_KEY)) === "1";
  } catch {
    return false;
  }
}

async function saveAccepted(accepted: boolean): Promise<void> {
  try {
    if (accepted) {
      await AsyncStorage.setItem(EULA_ACCEPTED_KEY, "1");
    } else {
      await AsyncStorage.removeItem(EULA_ACCEPTED_KEY);
    }
  } catch {
    // 保存に失敗しても、この画面での同意状態は有効
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      if (accepted) window.localStorage.setItem(EULA_ACCEPTED_KEY, "1");
      else window.localStorage.removeItem(EULA_ACCEPTED_KEY);
    } catch {
      /* noop */
    }
  }
}

const EULA_POINTS = [
  "嫌がらせ・差別・脅迫・性的・暴力的な表現など、不適切なコンテンツは一切容認しません。",
  "迷惑な利用者は一切容認しません。違反したコンテンツは削除し、アカウントを停止します。",
  "不快な相手はアプリ内でいつでも通報・ブロックできます。通報は24時間以内に確認します。",
] as const;

export function EulaConsentGate({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState<boolean>(readAcceptedSync);

  useEffect(() => {
    let alive = true;
    void readAccepted().then((v) => {
      if (alive && v) setAccepted(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(() => {
    setAccepted((prev) => {
      const next = !prev;
      void saveAccepted(next);
      return next;
    });
  }, []);

  return (
    <View style={{ width: "100%", gap: 14 }}>
      <View
        testID="eula-consent"
        style={{
          width: "100%",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.kimitoBorderSoft,
          backgroundColor: palette.kimitoBg,
          padding: 14,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "800", color: palette.gray900 }}>
          利用規約（EULA）への同意
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 20, color: palette.gray700 }}>
          ログイン・登録の前に、利用規約をお読みのうえ同意してください。
        </Text>
        <View style={{ gap: 6 }}>
          {EULA_POINTS.map((point) => (
            <View key={point} style={{ flexDirection: "row", gap: 6 }}>
              <Text style={{ fontSize: 13, lineHeight: 20, color: palette.gray900 }}>・</Text>
              <Text style={{ flex: 1, fontSize: 13, lineHeight: 20, color: palette.gray900, fontWeight: "700" }}>
                {point}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => navigate.toTerms()}
          accessibilityRole="link"
          accessibilityLabel="利用規約の全文を読む"
          style={({ pressed }) => [{ alignSelf: "flex-start", paddingVertical: 4 }, pressed && { opacity: 0.7 }]}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: palette.kimitoBlue, textDecorationLine: "underline" }}>
            利用規約の全文を読む
          </Text>
        </Pressable>
        <Pressable
          onPress={toggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="利用規約（EULA）に同意します"
          testID="eula-consent-checkbox"
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: accepted ? palette.kimitoBlue : palette.kimitoBorderSoft,
              backgroundColor: palette.white,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialIcons
            name={accepted ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={accepted ? palette.kimitoBlue : palette.gray700}
          />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: "800", color: palette.gray900 }}>
            利用規約（EULA）に同意します
          </Text>
        </Pressable>
      </View>

      {!accepted ? (
        <Text style={{ fontSize: 12, lineHeight: 18, color: palette.gray700, textAlign: "center" }}>
          同意するとログインボタンを押せるようになります
        </Text>
      ) : null}

      <View
        pointerEvents={accepted ? "auto" : "none"}
        accessibilityElementsHidden={!accepted}
        importantForAccessibility={accepted ? "auto" : "no-hide-descendants"}
        style={{ width: "100%", opacity: accepted ? 1 : 0.4 }}
      >
        {children}
      </View>
    </View>
  );
}
