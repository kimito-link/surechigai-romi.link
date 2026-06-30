/**
 * Web タブタイトル / ファビコン — Expo Head が +html の title を空に上書きするのを防ぐ。
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

export const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";

/** ビルド版数（sync-brand-to-dist.cjs が HTML に埋め込む値と揃える） */
const FAVICON_VERSION =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_BUILD_SHA
    ? process.env.EXPO_PUBLIC_BUILD_SHA.slice(0, 12)
    : "1";

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  const v = FAVICON_VERSION;

  return (
    <Head>
      <title>{DOCUMENT_TITLE}</title>
      <meta name="application-name" content={DOCUMENT_TITLE} />
      <link rel="icon" href={`/favicon.ico?v=${v}`} sizes="any" />
      <link rel="icon" type="image/png" sizes="16x16" href={`/favicon-16.png?v=${v}`} />
      <link rel="icon" type="image/png" sizes="32x32" href={`/favicon-32.png?v=${v}`} />
      <link rel="icon" type="image/png" sizes="48x48" href={`/favicon-48.png?v=${v}`} />
      <link rel="apple-touch-icon" href={`/apple-touch-icon.png?v=${v}`} />
    </Head>
  );
}
