/**
 * Web タブタイトル / ファビコン — ヘッダーと同じゆっくりりんく（pnpm brand:icons）
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

export const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";
/** iOS「ホーム画面に追加」のデフォルト名 */
export const PWA_APP_NAME = "君斗りんくのすれ違ひ通信-会いたい君がいる現在地";

const FAVICON_VERSION =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_BUILD_SHA
    ? process.env.EXPO_PUBLIC_BUILD_SHA.slice(0, 12)
    : "dev";

const TAB_ICON = `/favicon-48.png?v=${FAVICON_VERSION}`;
const APPLE_TOUCH_ICON = `/apple-touch-icon.png?v=${FAVICON_VERSION}`;

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  return (
    <Head>
      <title>{DOCUMENT_TITLE}</title>
      <meta name="application-name" content={PWA_APP_NAME} />
      <meta name="apple-mobile-web-app-title" content={PWA_APP_NAME} />
      <link rel="icon" href={TAB_ICON} type="image/png" sizes="48x48" />
      <link rel="shortcut icon" href={TAB_ICON} type="image/png" />
      <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON} />
    </Head>
  );
}
