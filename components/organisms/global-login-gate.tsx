import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { color } from "@/theme/tokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/organisms/screen-container";
import { AppHeader } from "@/components/organisms/app-header";
import { useLoginGuide } from "@/hooks/use-login-guide";

interface GlobalLoginGateProps {
  title: string;
  subtitle?: string;
  headerTitle: string;
  isDesktop?: boolean;
}

export function GlobalLoginGate({
  title,
  subtitle,
  headerTitle,
  isDesktop = false,
}: GlobalLoginGateProps) {
  const openLoginGuide = useLoginGuide();

  return (
    <ScreenContainer style={{ backgroundColor: "#FFFFFF" }} edges={["top", "left", "right"]}>
      <AppHeader title={headerTitle} showCharacters={false} isDesktop={isDesktop} showMenu showLoginButton={false} />
      
      <View style={styles.container}>
        {/* Characters */}
        <View style={styles.charactersContainer}>
          <Image
            source={require("@/assets/images/characters/tanune.png")}
            style={[styles.characterImage, styles.tanune]}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/characters/rinku.png")}
            style={[styles.characterImage, styles.rinku]}
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/characters/konta.png")}
            style={[styles.characterImage, styles.konta]}
            resizeMode="contain"
          />
        </View>

        {/* Hacker Auth Card */}
        <View style={styles.authCard}>
          <View style={styles.cardHeader}>
            <View style={styles.dotRed} />
            <View style={styles.dotYellow} />
            <View style={styles.dotGreen} />
            <Text style={styles.cardTitle}>SYSTEM / ACCESS_DENIED.exe</Text>
          </View>
          
          <View style={styles.cardBody}>
            <MaterialIcons name="security" size={48} color={color.danger} style={{ alignSelf: "center", marginBottom: 16 }} />
            <Text style={styles.titleText}>{title}</Text>
            {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
            
            <View style={styles.divider} />
            
            <Text style={styles.introText}>
              アクセス権限がありません。{"\n"}
              すれちがいロミは kimito.link と同じXログイン基盤を使います。{"\n"}
              認証後、このアプリへ戻ります。
            </Text>
            
            <Pressable
              style={({ pressed }) => [styles.button, styles.loginButton, pressed && styles.buttonPressed]}
              onPress={() => openLoginGuide()}
            >
              <MaterialIcons name="login" size={20} color={color.textWhite} style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>[ SYSTEM: Xログインの説明を見る ]</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: color.bg, // Dark background to pop the card
  },
  charactersContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 120,
    marginBottom: -20, // Overlap with auth card
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
  authCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(13, 17, 23, 0.95)", // dark transparent
    borderColor: color.danger,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: color.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 95, 86, 0.15)", // faint red
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.danger,
  },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF5F56", marginRight: 6 },
  dotYellow: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFBD2E", marginRight: 6 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27C93F", marginRight: 12 },
  cardTitle: {
    color: color.danger,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 0,
  },
  cardBody: {
    padding: 24,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 16,
  },
  introText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: "monospace",
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 4,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loginButton: {
    backgroundColor: color.accentIndigo,
  },
  buttonText: {
    color: color.textWhite,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});
