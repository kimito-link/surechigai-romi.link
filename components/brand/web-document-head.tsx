/**
 * Web タブタイトル / ファビコン — タブは icon-tab.png のみ（favicon.ico 競合を避ける）
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

export const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";

const FAVICON_VERSION =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_BUILD_SHA
    ? process.env.EXPO_PUBLIC_BUILD_SHA.slice(0, 12)
    : "dev";

const TAB_ICON = `/favicon-48.png?v=${FAVICON_VERSION}`;

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  return (
    <Head>
      <title>{DOCUMENT_TITLE}</title>
      <meta name="application-name" content={DOCUMENT_TITLE} />
      <link rel="icon" href={TAB_ICON} type="image/png" sizes="48x48" />
      <link rel="shortcut icon" href={TAB_ICON} type="image/png" />
      <link rel="apple-touch-icon" href={`/apple-touch-icon.png?v=${FAVICON_VERSION}`} />
    </Head>
  );
}
