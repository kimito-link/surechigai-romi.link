import { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { color, palette } from "@/theme/tokens";
import { useLoginGuide } from "@/hooks/use-login-guide";

// このヒーローの「ミッドナイト・シグナル」演出はティール固定（ブランドのトークン変更に影響されない）。
const SIGNAL_TEAL = palette.teal500;

// 「現在地」に添えるピンのサイズ（ヒーローサイズに比例）。
const PIN_SIZE_BY_HERO = {
  desktop: 36,
  tablet: 31,
  phone: 24,
  compactPhone: 20,
} as const;

interface RadarHudProps {
  onDismissIntro?: () => void;
  showIntro?: boolean;
  isAuthenticated?: boolean;
}

export function RadarHud({ onDismissIntro, showIntro = true, isAuthenticated }: RadarHudProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const openLoginGuide = useLoginGuide();
  const [isDismissed, setIsDismissed] = useState(!showIntro);

  if (isDismissed) return null;

  const isPhone = width < 640;
  const isCompactPhone = width < 390 || height < 700;
  const isTablet = width >= 640 && width < 1024;
  const heroSize = isPhone
    ? isCompactPhone
      ? "compactPhone"
      : "phone"
    : isTablet
      ? "tablet"
      : "desktop";

  const handleLoginPress = () => {
    openLoginGuide();
  };

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        {
          paddingTop: insets.top + (isPhone ? 10 : 16),
          zIndex: 100,
          pointerEvents: "box-none",
        },
      ]}
    >
        {/* HERO HEADER: 大タイトル + 読み + キャッチコピー（テキストは選択可能） */}
        <View style={[styles.header, styles.pointerBoxNone, stylesBySize[heroSize].header]}>
          <Image
            source={require("@/assets/images/logos/kimitolink-logo.webp")}
            style={[styles.logo, stylesBySize[heroSize].logo]}
            resizeMode="contain"
          />
          <Text selectable style={[styles.heroTitle, stylesBySize[heroSize].heroTitle]}>
            君斗りんくの{"\n"}すれ違ひ通信 v1.0.0
          </Text>
          <Text selectable style={[styles.heroReading, stylesBySize[heroSize].heroReading]}>
            SURECHIGAI TSUSHIN
          </Text>
          <View style={[styles.catchSignal, stylesBySize[heroSize].catchSignal]}>
            <Text selectable style={[styles.catchKicker, stylesBySize[heroSize].catchKicker]}>
              CORE SIGNAL
            </Text>
            <Text selectable style={[styles.catchMain, stylesBySize[heroSize].catchMain]}>
              会いたい君がいる
            </Text>
            {/* 「現在地」にピンを添えて“正確な場所を残す”価値を示す */}
            <View style={styles.catchAccentRow}>
              <MaterialIcons
                name="place"
                size={PIN_SIZE_BY_HERO[heroSize]}
                color={SIGNAL_TEAL}
                style={styles.catchPin}
              />
              <Text
                selectable
                style={[styles.catchMain, styles.catchMainAccent, stylesBySize[heroSize].catchMain]}
              >
                現在地
              </Text>
            </View>
          </View>
          <Text selectable style={[styles.catchSub, stylesBySize[heroSize].catchSub]}>
            キミは今、どこにいる？
          </Text>

          {/* ログインボタン（最優先・キャッチ直下に大きく）。未ログイン時のみ。 */}
          {!isAuthenticated && (
            <Pressable
              style={({ pressed }) => [
                styles.heroLoginButton,
                stylesBySize[heroSize].heroLoginButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleLoginPress}
            >
              <Text style={[styles.heroLoginText, stylesBySize[heroSize].heroLoginText]}>
                X（Twitter）ではじめる
              </Text>
              <Text style={[styles.heroLoginSub, stylesBySize[heroSize].heroLoginSub]}>
                無料・1タップ / 新規登録もこちら
              </Text>
            </Pressable>
          )}
        </View>

        {/* INTRO CARD & CHARACTERS */}
        <View style={[styles.bottomSection, styles.pointerBoxNone, stylesBySize[heroSize].bottomSection]}>
          {/* Characters */}
          <View style={[styles.charactersContainer, styles.pointerNone, stylesBySize[heroSize].charactersContainer]}>
            <Image
              source={require("@/assets/images/characters/tanune.png")}
              style={[styles.characterImage, stylesBySize[heroSize].characterImage, styles.tanune, stylesBySize[heroSize].tanune]}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/images/characters/rinku.png")}
              style={[styles.characterImage, styles.rinku, stylesBySize[heroSize].rinku]}
              resizeMode="contain"
            />
            <Image
              source={require("@/assets/images/characters/konta.png")}
              style={[styles.characterImage, stylesBySize[heroSize].characterImage, styles.konta, stylesBySize[heroSize].konta]}
              resizeMode="contain"
            />
          </View>

          {/* Intro Card（ログイン後の「了解／監視を開始」専用。未ログイン時はヒーローのログインボタンで完結）。 */}
          {isAuthenticated && (
            <View style={[styles.introCard, stylesBySize[heroSize].introCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.dotRed} />
                <View style={styles.dotYellow} />
                <View style={styles.dotGreen} />
                <Text style={styles.cardTitle}>SYSTEM / INTRO.exe</Text>
              </View>

              <View style={[styles.cardBody, stylesBySize[heroSize].cardBody]}>
                <Text style={[styles.introText, stylesBySize[heroSize].introText]}>
                  Kimito-link シグナル傍受システムへようこそ。{"\n"}
                  レーダー上の光点（すれちがい）をタップして通信をデコードしろ。
                </Text>

                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={() => {
                    setIsDismissed(true);
                    onDismissIntro?.();
                  }}
                >
                  <Text style={styles.buttonText}>[ SYSTEM: 了解 / 監視を開始 ]</Text>
                </Pressable>
              </View>
            </View>
          )}

        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    minHeight: 0,
  },
  pointerBoxNone: {
    pointerEvents: "box-none",
  },
  pointerNone: {
    pointerEvents: "none",
  },
  header: {
    flex: 1, // 画面の上半分を占め、その中央にタイトルを大きく置く
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  logo: {
    width: 130,
    height: 44,
    opacity: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#eef4fb",
    fontSize: 60,
    fontWeight: "800",
    lineHeight: 78,
    letterSpacing: 0,
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "rgba(8,16,30,0.95)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 30,
  },
  heroReading: {
    color: "#8fb0d6",
    fontSize: 13,
    letterSpacing: 0,
    marginTop: 14,
    fontFamily: "monospace",
  },
  catchSignal: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SIGNAL_TEAL,
    // 夜空背景でも本文が確実に読めるよう、パネルを濃いめ（85%）に。
    backgroundColor: color.bg + "D9",
    shadowColor: SIGNAL_TEAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 24,
  },
  catchAccentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  catchPin: {
    marginRight: 4,
    textShadowColor: SIGNAL_TEAL,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  catchKicker: {
    color: SIGNAL_TEAL,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 8,
    fontFamily: "monospace",
  },
  catchMain: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 52,
    letterSpacing: 0,
    textAlign: "center",
    textShadowColor: SIGNAL_TEAL,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  catchMainAccent: {
    color: SIGNAL_TEAL,
  },
  catchSub: {
    color: "#bcd4f0",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 0,
    marginTop: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },
  heroLoginButton: {
    marginTop: 34,
    minWidth: 280,
    maxWidth: 360,
    width: "86%",
    backgroundColor: SIGNAL_TEAL,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: SIGNAL_TEAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLoginText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0,
  },
  heroLoginSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0,
  },
  bottomSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 80, // Tab bar avoidance
    paddingHorizontal: 20,
  },
  charactersContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 120,
    marginBottom: -20, // Overlap with intro card
    zIndex: 10,
    width: '100%',
  },
  characterImage: {
    width: 100,
    height: 120,
  },
  rinku: {
    width: 120,
    height: 140,
    zIndex: 3,
  },
  tanune: {
    zIndex: 1,
    marginRight: -30,
    transform: [{ rotate: '-10deg' }],
  },
  konta: {
    zIndex: 2,
    marginLeft: -30,
    transform: [{ rotate: '10deg' }],
  },
  introCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(13, 17, 23, 0.85)", // dark transparent
    borderColor: color.accentPrimary,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: color.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 128, 51, 0.15)", // faint accent
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.accentPrimary,
  },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F56", marginRight: 6 },
  dotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E", marginRight: 6 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27C93F", marginRight: 12 },
  cardTitle: {
    color: color.accentPrimary,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 0,
  },
  cardBody: {
    padding: 16,
  },
  introText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "rgba(255, 128, 51, 0.2)",
    borderColor: color.accentPrimary,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 128, 51, 0.4)",
  },
  loginButton: {
    backgroundColor: SIGNAL_TEAL,
    borderColor: "transparent",
  },
  buttonText: {
    fontFamily: "monospace",
  },
});

const stylesBySize = {
  desktop: StyleSheet.create({
    header: {
      flex: 1.35,
    },
    logo: {
      width: 120,
      height: 40,
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 56,
      lineHeight: 68,
      marginTop: 6,
    },
    heroReading: {},
    catchSignal: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    catchKicker: {},
    catchMain: {
      fontSize: 38,
      lineHeight: 47,
    },
    catchSub: {
      fontSize: 22,
      marginTop: 12,
    },
    heroLoginButton: {
      marginTop: 30,
    },
    heroLoginText: {
      fontSize: 18,
    },
    heroLoginSub: {},
    bottomSection: {
      flex: 0.65,
    },
    charactersContainer: {},
    characterImage: {},
    rinku: {},
    tanune: {},
    konta: {},
    introCard: {},
    cardBody: {},
    introText: {},
  }),
  tablet: StyleSheet.create({
    header: {
      paddingHorizontal: 18,
    },
    logo: {
      width: 118,
      height: 40,
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 48,
      lineHeight: 60,
      marginTop: 6,
    },
    heroReading: {
      fontSize: 12,
      marginTop: 12,
    },
    catchSignal: {
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 13,
    },
    catchKicker: {
      fontSize: 10,
      marginBottom: 7,
    },
    catchMain: {
      fontSize: 32,
      lineHeight: 40,
    },
    catchSub: {
      fontSize: 18,
      marginTop: 12,
    },
    heroLoginButton: {
      marginTop: 28,
      maxWidth: 340,
      paddingVertical: 15,
    },
    heroLoginText: {
      fontSize: 18,
    },
    heroLoginSub: {},
    bottomSection: {
      paddingBottom: 76,
    },
    charactersContainer: {
      height: 106,
      marginBottom: -14,
    },
    characterImage: {
      width: 86,
      height: 104,
    },
    rinku: {
      width: 102,
      height: 124,
    },
    tanune: {
      marginRight: -24,
    },
    konta: {
      marginLeft: -24,
    },
    introCard: {},
    cardBody: {},
    introText: {},
  }),
  phone: StyleSheet.create({
    header: {
      paddingHorizontal: 14,
      justifyContent: "center",
    },
    logo: {
      width: 104,
      height: 34,
      marginBottom: 4,
    },
    heroTitle: {
      fontSize: 34,
      lineHeight: 42,
      marginTop: 4,
    },
    heroReading: {
      fontSize: 10,
      marginTop: 8,
    },
    catchSignal: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 11,
      width: "100%",
      maxWidth: 330,
    },
    catchKicker: {
      fontSize: 9,
      marginBottom: 6,
    },
    catchMain: {
      fontSize: 25,
      lineHeight: 32,
    },
    catchSub: {
      fontSize: 14,
      marginTop: 8,
    },
    heroLoginButton: {
      marginTop: 20,
      minWidth: 0,
      width: "100%",
      maxWidth: 320,
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 24,
    },
    heroLoginText: {
      fontSize: 16,
    },
    heroLoginSub: {
      fontSize: 10,
      marginTop: 3,
    },
    bottomSection: {
      paddingBottom: 72,
      paddingHorizontal: 12,
    },
    charactersContainer: {
      height: 86,
      marginBottom: 0,
    },
    characterImage: {
      width: 68,
      height: 82,
    },
    rinku: {
      width: 80,
      height: 96,
    },
    tanune: {
      marginRight: -18,
    },
    konta: {
      marginLeft: -18,
    },
    introCard: {
      maxWidth: 340,
    },
    cardBody: {
      padding: 14,
    },
    introText: {
      fontSize: 12,
      lineHeight: 19,
    },
  }),
  compactPhone: StyleSheet.create({
    header: {
      paddingHorizontal: 12,
      justifyContent: "center",
    },
    logo: {
      width: 92,
      height: 30,
      marginBottom: 2,
    },
    heroTitle: {
      fontSize: 30,
      lineHeight: 37,
      marginTop: 2,
    },
    heroReading: {
      fontSize: 9,
      marginTop: 6,
    },
    catchSignal: {
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
      width: "100%",
      maxWidth: 300,
    },
    catchKicker: {
      fontSize: 8,
      marginBottom: 5,
    },
    catchMain: {
      fontSize: 21,
      lineHeight: 27,
    },
    catchSub: {
      fontSize: 12,
      marginTop: 6,
    },
    heroLoginButton: {
      marginTop: 14,
      minWidth: 0,
      width: "100%",
      maxWidth: 300,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 22,
    },
    heroLoginText: {
      fontSize: 15,
    },
    heroLoginSub: {
      fontSize: 9,
      marginTop: 2,
    },
    bottomSection: {
      paddingBottom: 62,
      paddingHorizontal: 10,
    },
    charactersContainer: {
      height: 70,
      marginBottom: 0,
    },
    characterImage: {
      width: 58,
      height: 70,
    },
    rinku: {
      width: 70,
      height: 82,
    },
    tanune: {
      marginRight: -16,
    },
    konta: {
      marginLeft: -16,
    },
    introCard: {
      maxWidth: 320,
    },
    cardBody: {
      padding: 12,
    },
    introText: {
      fontSize: 12,
      lineHeight: 18,
    },
  }),
} as const;
