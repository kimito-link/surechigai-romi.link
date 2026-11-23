/**
 * 共有リンクの着地ページに置く、アプリDL導線。
 *
 * 狙い（2026-08-10 の Foursquare Swarm 調査より）:
 * Swarm の共有ページは下半分がまるごとストアボタンで、
 * 共有リンクを「アプリ獲得の入口」として使い切っている。
 * こちらの /u/{slug} は地図と足あとを見せる作りで、この導線が無かった。
 *
 * 出さない条件（無いより悪い導線を作らないため）:
 * - すでにネイティブアプリの中で見ている（Expo prebuild も Capacitor 殻も。isNativeAppShell）
 * - 配信中のストアが1つも無い（app.config.json の stores が空）
 * - 閲覧端末のストアがまだ配信前（例: iPhone で見ているのに App Store が未公開）
 *
 * ★2026-11-22 トップ（ゲスト用ホーム）にも置いた（web-ios-android docs/ai-rules/15_APP_LINK_FROM_WEB.md
 *   「アプリがある Web には必ずアプリへの導線」）。あわせて次の3点を金型 templates/web/ に揃えた:
 *   - 自作のボタンをやめ、公式バッジ（public/store-badges/・fetch-store-badges.mjs で取得、改変しない）。
 *     高さ48pxで揃える＝Google のバッジを Apple より小さくしない。
 *   - 端末で出し分け: iPhone/iPad→App Store だけ／Android→Google Play だけ／PC→配信中の全部。
 *     以前は「閲覧端末のものを先頭に並べ替え」で、iPhone にも Google Play を出していた。
 *   - Web は本物の <a>（href が HTML に出る＝検索・本番の見張り check-app-link.mjs が読める）。
 *   いまの実例: https://play.google.com/store/apps/details?id=com.kimito.link.surechigai
 *   （URL は lib/store-links.ts が app.config.json の stores から組む。ここに直書きしない）
 */
import { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import {
  availableStoreLinks,
  guessViewerPlatform,
  type StoreLink,
} from "@/lib/store-links";
import { isNativeAppShell } from "@/lib/native-app-shell";
import { color } from "@/theme/tokens";

type AppDownloadCtaProps = {
  /** 見出し。誰の足あとを見ているかで文言を変えられる */
  headline?: string;
  /** 補足文。省略時は既定のコピー */
  note?: string;
};

const DEFAULT_HEADLINE = "この足あとを、あなたの現在地からたどる";
const DEFAULT_NOTE = "アプリなら、すれ違った人と足あとが自動で残ります";

/** 公式バッジ（public/store-badges/）。幅は高さ48pxのときの実寸（Apple 108.85:40 / Google 646:250）。 */
const BADGE: Record<StoreLink["kind"], { src: string; alt: string; width: number }> = {
  ios: { src: "/store-badges/apple-appstore-ja.svg", alt: "App Storeで入手", width: 131 },
  android: { src: "/store-badges/google-play-ja.png", alt: "Google Playで手に入れよう", width: 124 },
};
const BADGE_HEIGHT = 48;

/**
 * 出すストアを決める。端末が分かればそのストアだけ（未配信なら0件＝何も出さない）、
 * PC など分からなければ配信中の全部。
 */
export function storeLinksForViewer(
  links: StoreLink[],
  viewer: StoreLink["kind"] | null,
): StoreLink[] {
  if (!viewer) return links;
  return links.filter((l) => l.kind === viewer);
}

export function AppDownloadCta({
  headline = DEFAULT_HEADLINE,
  note = DEFAULT_NOTE,
}: AppDownloadCtaProps) {
  // ★判定はブラウザで描いた後（useEffect）にする。Web は静的書き出し（app.config.ts web.output=static）で、
  //   書き出し時（Node）には端末も Capacitor も分からない。先に描くと、iPhone で別 OS のバッジが一瞬見えたり、
  //   アプリ（Capacitor 殻）の中でバッジが一瞬見えたりする（hydration の食い違いにもなる）。
  const [links, setLinks] = useState<StoreLink[] | null>(null);
  useEffect(() => {
    // アプリの中で「アプリをダウンロード」は無意味（Capacitor 殻は Platform.OS が web になるので両方見る）。
    // ネイティブには <a> が無いので、Web 以外でも出さない。
    if (isNativeAppShell() || Platform.OS !== "web") {
      setLinks([]);
      return;
    }
    setLinks(storeLinksForViewer(availableStoreLinks(), guessViewerPlatform()));
  }, []);
  if (!links || links.length === 0) return null;

  return (
    <View style={styles.wrap} testID="app-download-cta">
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.note}>{note}</Text>
      <View style={styles.buttons}>
        {links.map((link) => {
          const badge = BADGE[link.kind];
          return (
            <a
              key={link.kind}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} でアプリを入手`}
              data-store={link.kind}
              style={webBadgeAnchorStyle}
            >
              <img
                src={badge.src}
                alt={badge.alt}
                width={badge.width}
                height={BADGE_HEIGHT}
                style={webBadgeImgStyle}
              />
            </a>
          );
        })}
      </View>
    </View>
  );
}

const webBadgeAnchorStyle = { display: "inline-flex", lineHeight: 0 } as const;
const webBadgeImgStyle = { height: BADGE_HEIGHT, width: "auto", display: "block" } as const;

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
});
