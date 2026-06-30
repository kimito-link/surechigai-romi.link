/**
 * Web タブタイトル / ファビコン — Expo Head が +html の title を空に上書きするのを防ぐ。
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

export const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";

const FAVICON_VERSION =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_BUILD_SHA
    ? process.env.EXPO_PUBLIC_BUILD_SHA.slice(0, 12)
    : "dev";

/** CDN キャッシュ回避 — 新パス /brand/icon-tab.png を主 favicon に */
const TAB_ICON = `/brand/icon-tab.png?v=${FAVICON_VERSION}`;

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  return (
    <Head>
      <title>{DOCUMENT_TITLE}</title>
      <meta name="application-name" content={DOCUMENT_TITLE} />
      <link rel="icon" href={TAB_ICON} type="image/png" sizes="48x48" />
      <link rel="icon" href={`/favicon.ico?v=${FAVICON_VERSION}`} sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href={`/favicon-32.png?v=${FAVICON_VERSION}`} />
      <link rel="apple-touch-icon" href={`/apple-touch-icon.png?v=${FAVICON_VERSION}`} />
    </Head>
  );
}
