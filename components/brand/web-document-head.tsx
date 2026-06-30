/**
 * Web タブタイトル / ファビコン — Expo Head が +html の title を空に上書きするのを防ぐ。
 */
import Head from "expo-router/head";
import { Platform } from "react-native";

const DOCUMENT_TITLE = "君斗りんくのすれ違ひ通信";

export function WebDocumentHead() {
  if (Platform.OS !== "web") return null;

  return (
    <Head>
      <title>{DOCUMENT_TITLE}</title>
      <meta name="application-name" content={DOCUMENT_TITLE} />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}
