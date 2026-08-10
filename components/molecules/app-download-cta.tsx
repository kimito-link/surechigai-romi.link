/**
 * 共有リンクの着地ページに置く、アプリDL導線。
 *
 * 狙い（2026-08-10 の Foursquare Swarm 調査より）:
 * Swarm の共有ページは下半分がまるごとストアボタンで、
 * 共有リンクを「アプリ獲得の入口」として使い切っている。
 * こちらの /u/{slug} は地図と足あとを見せる作りで、この導線が無かった。
 *
 * 出さない条件（無いより悪い導線を作らないため）:
 * - すでにネイティブアプリの中で見ている
 * - 配信中のストアが1つも無い（app.config.json の stores が空）
 */
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialIcons from "@/lib/icons/material-icons";
import { openExternalUrl } from "@/lib/navigation/external-links";
import {
  availableStoreLinks,
  isInsideNativeApp,
  guessViewerPlatform,
  type StoreLink,
} from "@/lib/store-links";
import { color, palette } from "@/theme/tokens";

type AppDownloadCtaProps = {
  /** 見出し。誰の足あとを見ているかで文言を変えられる */
  headline?: string;
  /** 補足文。省略時は既定のコピー */
  note?: string;
};

const DEFAULT_HEADLINE = "この足あとを、あなたの現在地からたどる";
const DEFAULT_NOTE = "アプリなら、すれ違った人と足あとが自動で残ります";

function storeIcon(kind: StoreLink["kind"]): keyof typeof MaterialIcons.glyphMap {
  return kind === "ios" ? "phone-iphone" : "android";
}

export function AppDownloadCta({
  headline = DEFAULT_HEADLINE,
  note = DEFAULT_NOTE,
}: AppDownloadCtaProps) {
  // アプリの中で「アプリをダウンロード」は無意味
  if (isInsideNativeApp()) return null;

  const links = availableStoreLinks();
  if (links.length === 0) return null;

  // 閲覧環境に合うものを先頭に。推定できなければ元の順のまま
  const viewer = guessViewerPlatform();
  const ordered = viewer
    ? [...links].sort((a, b) => (a.kind === viewer ? -1 : b.kind === viewer ? 1 : 0))
    : links;

  return (
    <View style={styles.wrap}>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.note}>{note}</Text>
      <View style={styles.buttons}>
        {ordered.map((link, index) => {
          const primary = index === 0;
          return (
            <Pressable
              key={link.kind}
              accessibilityRole="link"
              accessibilityLabel={`${link.label} でアプリを入手`}
              style={[styles.button, primary ? styles.buttonPrimary : styles.buttonSecondary]}
              onPress={() => {
                void openExternalUrl(link.url);
              }}
            >
              <MaterialIcons
                name={storeIcon(link.kind)}
                size={18}
                color={primary ? palette.white : palette.kimitoBlue}
              />
              <Text
                style={[
                  styles.buttonText,
                  primary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
                ]}
                numberOfLines={1}
              >
                {link.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    gap: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  headline: {
    color: color.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  note: {
    color: color.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  buttons: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  button: {
    // 44pt はタップ標的の下限。これを下回ると押しにくい
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonPrimary: {
    backgroundColor: palette.kimitoBlue,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: palette.kimitoBlue,
    backgroundColor: color.surface,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  buttonTextPrimary: {
    color: palette.white,
  },
  buttonTextSecondary: {
    color: palette.kimitoBlue,
  },
});
