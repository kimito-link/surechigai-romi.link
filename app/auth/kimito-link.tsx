import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/organisms/app-header";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { navigateBack, navigateReplace } from "@/lib/navigation";
import { color, palette } from "@/theme/tokens";

const CHARACTER_IMAGES = [
  require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
];

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeReturnTo(value?: string): string {
  if (!value || value.startsWith("http://") || value.startsWith("https://")) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

export default function KimitoLinkAuthGuideScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; mode?: string }>();
  const { width } = useWindowDimensions();
  const { login, isAuthenticated } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  const isPhone = width < 640;
  const returnTo = useMemo(() => normalizeReturnTo(firstParam(params.returnTo)), [params.returnTo]);
  const mode = firstParam(params.mode);
  const isSwitchMode = mode === "switch";

  const handleContinue = async () => {
    setIsStarting(true);
    try {
      await login(returnTo, isSwitchMode);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScreenContainer style={{ backgroundColor: color.bg }} edges={["top", "left", "right", "bottom"]}>
      <AppHeader
        title="Xログインの確認"
        showCharacters={false}
        showMenu
        showLoginStatus
        showLoginButton={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: isPhone ? 16 : 24, paddingTop: isPhone ? 18 : 28 },
        ]}
      >
        <View style={[styles.guideCard, { maxWidth: isPhone ? 420 : 720 }]}>
          <View style={styles.characterRow}>
            {CHARACTER_IMAGES.map((source, index) => (
              <Image
                key={index}
                source={source}
                style={[
                  styles.character,
                  isPhone && styles.characterPhone,
                  index === 1 && styles.characterCenter,
                ]}
                contentFit="contain"
              />
            ))}
          </View>

          <View style={styles.badge}>
            <MaterialIcons name="verified-user" size={16} color={color.successDark} />
            <Text style={styles.badgeText}>ログイン前の案内</Text>
          </View>

          <Text style={[styles.title, isPhone && styles.titlePhone]}>
            このあと kimito.link のX認証画面に移動します
          </Text>

          <Text style={styles.lead}>
            君斗りんくのすれ違ひ通信は、姉妹サービス kimito.link と同じXログイン基盤を使っています。
            だから認証中だけ kimito.link が表示されますが、完了後はこのアプリに戻ります。
          </Text>

          <View style={styles.reasonList}>
            <View style={styles.reasonItem}>
              <MaterialIcons name="hub" size={20} color={color.accentPrimary} />
              <View style={styles.reasonTextWrap}>
                <Text style={styles.reasonTitle}>同じアカウントでつながるため</Text>
                <Text style={styles.reasonText}>
                  kimito.link 側の認証を使うことで、Xアカウントを共通のシグナルIDとして扱います。
                </Text>
              </View>
            </View>

            <View style={styles.reasonItem}>
              <MaterialIcons name="lock" size={20} color={color.accentIndigo} />
              <View style={styles.reasonTextWrap}>
                <Text style={styles.reasonTitle}>Xの許可画面を通すため</Text>
                <Text style={styles.reasonText}>
                  パスワードをこのアプリが受け取ることはありません。Xの公式OAuth画面で許可します。
                </Text>
              </View>
            </View>

            <View style={styles.reasonItem}>
              <MaterialIcons name="keyboard-return" size={20} color={color.successDark} />
              <View style={styles.reasonTextWrap}>
                <Text style={styles.reasonTitle}>認証後は戻ってくるため</Text>
                <Text style={styles.reasonText}>
                  ログインが終わると、今見ていたページまたはホームに戻ります。
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              {isSwitchMode
                ? "別のXアカウントで接続したい場合は、X側の画面で使うアカウントを選んでください。"
                : "次の画面で kimito.link が表示されたら、正しいログイン画面です。"}
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            {isAuthenticated ? (
              <Button
                onPress={() => navigateReplace.withUrl(returnTo)}
                icon="home"
                fullWidth
                style={{ backgroundColor: color.accentIndigo }}
              >
                アプリへ戻る
              </Button>
            ) : (
              <Button
                onPress={handleContinue}
                loading={isStarting}
                disabled={isStarting}
                icon="login"
                fullWidth
                style={{ backgroundColor: palette.kimitoBlue }}
              >
                kimito.link のXログインへ進む
              </Button>
            )}

            <Button
              onPress={navigateBack}
              variant="outline"
              icon="arrow-back"
              fullWidth
            >
              いったん戻る
            </Button>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 32,
  },
  guideCard: {
    width: "100%",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderAlt,
    borderRadius: 8,
    padding: 20,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  characterRow: {
    height: 92,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 8,
  },
  character: {
    width: 82,
    height: 92,
    marginHorizontal: -6,
  },
  characterPhone: {
    width: 66,
    height: 78,
    marginHorizontal: -5,
  },
  characterCenter: {
    width: 96,
    height: 106,
    zIndex: 2,
  },
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: color.success + "22",
    borderWidth: 1,
    borderColor: color.success + "44",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  badgeText: {
    color: color.successDark,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: color.textPrimary,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0,
    marginBottom: 12,
  },
  titlePhone: {
    fontSize: 22,
    lineHeight: 30,
  },
  lead: {
    color: color.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 18,
  },
  reasonList: {
    gap: 10,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: 12,
  },
  reasonTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  reasonTitle: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  reasonText: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  noticeBox: {
    backgroundColor: color.accentIndigo + "18",
    borderWidth: 1,
    borderColor: color.accentIndigo + "44",
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  noticeText: {
    color: color.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonGroup: {
    gap: 10,
  },
});
