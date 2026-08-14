/**
 * /photo-import — 写真から思い出をとりこむ。
 *
 * 実体は components/photo-import/photo-import-screen.tsx。
 * ここでは Head（Web の meta）だけ足す。
 *
 * ★このファイルで Clerk の React フック（useUser 等）を import しないこと。
 *   ClerkProvider は app/_layout.tsx で動的 import される設計のため、
 *   解決前に描画されるとアプリ全体が落ちる（2026-07-31 / 08-01 に2度発生）。
 *   認証状態は useAuth()（lib/auth-context 経由）で受け取る。
 */
import { Platform } from "react-native";
import Head from "expo-router/head";
import { PhotoImportScreen } from "@/components/photo-import/photo-import-screen";

export default function PhotoImportRoute() {
  return (
    <>
      {Platform.OS === "web" ? (
        <Head>
          <title>写真から思い出をとりこむ｜君斗りんくのすれ違ひ通信</title>
          <meta
            name="description"
            content="過去に撮った写真の場所と日時だけを読み取って、あなたの足あととして地図に灯します。写真そのものは送信されません。"
          />
        </Head>
      ) : null}
      <PhotoImportScreen />
    </>
  );
}
