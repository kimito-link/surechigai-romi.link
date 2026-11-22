/**
 * /nearby — みんなの居場所（地図＋近い順リスト）。下のタブ「みんな」。
 *
 * 実体は components/nearby/nearby-presence-screen.tsx。ここでは Head（Web の meta）だけ足す。
 * ★このファイルで Clerk の React フックを import しないこと（app/photo-import.tsx と同じ理由）。
 */
import { Platform } from "react-native";
import Head from "expo-router/head";
import { NearbyPresenceScreen } from "@/components/nearby/nearby-presence-screen";

export default function NearbyRoute() {
  return (
    <>
      {Platform.OS === "web" ? (
        <Head>
          <title>みんなの居場所｜君斗りんくのすれ違ひ通信</title>
          <meta name="description" content="いま地図に出ている人を、現在地から近い順に地図とリストで見られます。" />
        </Head>
      ) : null}
      <NearbyPresenceScreen />
    </>
  );
}
