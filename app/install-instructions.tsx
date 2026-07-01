/**
 * PWA インストール手順 — iOS / Android / Desktop
 */
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { palette } from "@/theme/tokens";

const RINKU = require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png");

type Step = { title: string; body: string };

function getSteps(platform: ReturnType<typeof usePwaInstall>["platform"]): Step[] {
  if (platform === "ios") {
    return [
      { title: "Safari でこのページを開く", body: "Chrome 等では追加できません。Safari を使ってください。" },
      { title: "共有ボタンをタップ", body: "画面下（または上）の共有アイコン（□↑）を押します。" },
      { title: "「ホーム画面に追加」", body: "一覧から選び、名前を確認して「追加」をタップ。" },
      { title: "ホーム画面から起動", body: "追加されたアイコンから、アプリのように開けます。" },
    ];
  }
  if (platform === "android") {
    return [
      { title: "Chrome でこのページを開く", body: "推奨ブラウザは Google Chrome です。" },
      { title: "メニュー（⋮）を開く", body: "画面右上の三点メニュー、または下に表示されるバナー。" },
      { title: "「アプリをインストール」", body: "または「ホーム画面に追加」を選びます。" },
      { title: "ホーム画面から起動", body: "インストール後、アプリ一覧やホーム画面から開けます。" },
    ];
  }
  return [
    { title: "Chrome / Edge で開く", body: "デスクトップ PWA は Chromium 系ブラウザが対応しています。" },
    { title: "アドレスバーのインストール", body: "URL 右側の ⊕ または「インストール」アイコンをクリック。" },
    { title: "確認ダイアログで追加", body: "「インストール」を選ぶと、独立ウィンドウで起動できます。" },
    { title: "アプリ一覧から起動", body: "OS のアプリ一覧やタスクバーに追加されます。" },
  ];
}

export default function InstallInstructionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { platform, isInstallable, promptInstall, isStandalone } = usePwaInstall();
  const steps = getSteps(platform);

  if (Platform.OS !== "web") {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>Web 版専用の画面です</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <MaterialIcons name="arrow-back" size={22} color="#F5F5F5" />
          <Text style={styles.backText}>戻る</Text>
        </Pressable>

        <View style={styles.heroRow}>
          <Image source={RINKU} style={styles.heroImage} contentFit="contain" />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ホーム画面に追加</Text>
            <Text style={styles.title}>アプリのように{"\n"}すぐ開ける</Text>
          </View>
        </View>

        {isStandalone ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>すでにホーム画面から起動しています</Text>
          </View>
        ) : null}

        {isInstallable ? (
          <Pressable
            onPress={() => void promptInstall()}
            style={({ pressed }) => [styles.installBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
          >
            <Text style={styles.installBtnText}>インストール</Text>
          </Pressable>
        ) : null}

        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>
            {platform === "ios" ? "iPhone / iPad（Safari）" : platform === "android" ? "Android（Chrome）" : "パソコン（Chrome / Edge）"}
          </Text>
          {steps.map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          チェックインや位置の許可は、ホーム画面から開くとブラウザよりスムーズです。
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    paddingHorizontal: 20,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  unsupported: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
  },
  unsupportedText: {
    color: "#A3A3A3",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    color: "#F5F5F5",
    fontSize: 15,
    fontWeight: "600",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  heroImage: {
    width: 96,
    height: 96,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.teal500,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F5F5F5",
    lineHeight: 32,
  },
  doneBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  doneText: {
    color: palette.teal500,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  installBtn: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: palette.primary500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  installBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  stepsCard: {
    backgroundColor: "#171717",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 18,
    gap: 16,
  },
  stepsHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.kimitoBlue,
    letterSpacing: 0.3,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.kimitoBlue + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: palette.kimitoBlue,
    fontWeight: "800",
    fontSize: 13,
  },
  stepBody: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F5F5",
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: "#A3A3A3",
  },
  footerNote: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    color: "#737373",
    textAlign: "center",
  },
});
