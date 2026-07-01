/**
 * Web タブタイトル / ファビコン — 君斗りんく アイドルキャラ（pnpm brand:icons）
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

/** ブラウザタブ・iOS ホーム画面追加の正式名称 */
export const PWA_APP_NAME = "君斗りんくのすれ違ひ通信-会いたい君がいる現在地";
/** ヘッダー等の短い表示用 */
export const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";

const FAVICON_VERSION =
  typeof process !== "undefined" && process.env.EXPO_PUBLIC_BUILD_SHA
    ? process.env.EXPO_PUBLIC_BUILD_SHA.slice(0, 12)
    : "dev";

const TAB_ICON = `/favicon-48.png?v=${FAVICON_VERSION}`;
const APPLE_TOUCH_ICON = `/pwa-icon-180.png?v=${FAVICON_VERSION}`;
const MANIFEST_HREF = `/manifest.json?v=${FAVICON_VERSION}`;

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  return (
    <Head>
      <title>{PWA_APP_NAME}</title>
      <meta name="application-name" content={PWA_APP_NAME} />
      <meta name="apple-mobile-web-app-title" content={PWA_APP_NAME} />
      <link rel="manifest" href={MANIFEST_HREF} />
      <link rel="icon" href={TAB_ICON} type="image/png" sizes="48x48" />
      <link rel="shortcut icon" href={TAB_ICON} type="image/png" />
      <link rel="apple-touch-icon" sizes="180x180" href={APPLE_TOUCH_ICON} />
    </Head>
  );
}
