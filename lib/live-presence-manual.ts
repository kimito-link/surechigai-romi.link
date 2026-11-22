/**
 * lib/live-presence-manual.ts — 「居場所を地図に出す」を手動チェックインだけにするか。
 *
 * 2026-11-21 iOS build 556 が Guideline 5.1.2(i) で却下された。Apple の指示:
 *   - 地図に自分の位置を出すことについて許可を求め、断る選択肢を用意すること
 *   - 地図に位置を出すのは毎回ユーザーが手動でチェックインしたときだけ。自動チェックインは不可
 *
 * そこで iOS アプリでは「居場所をリアルタイム公開」を
 *   - 自動で ON にしない（use-auto-start-live-presence）
 *   - ON の間も自動で位置を送り続けない（use-live-presence の watch/interval を止める）
 *   - 「いまの場所を地図に出す」を押したとき／チェックインしたときに1回だけ送る
 *     （サーバー側は 5 分を過ぎた位置を地図から消すので、押さなければ自然に消える）
 * に変える。Web と Android は従来どおり。
 */
import { Platform } from "react-native";

export const LIVE_PRESENCE_MANUAL_CHECKIN = Platform.OS === "ios";

/** 地図に出たままになる時間の目安（presence.list の 5 分窓と揃える） */
export const LIVE_PRESENCE_MANUAL_VISIBLE_MINUTES = 5;
