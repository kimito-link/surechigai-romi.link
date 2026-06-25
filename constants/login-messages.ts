/**
 * ログインメッセージとキャラクターの対応設定
 *
 * キャラクター役割に基づくメッセージ:
 * - main: りんく（主役） … デフォルト・主要UI
 * - community: こん太（盛り上げ役） … 友達を誘う・シェア
 * - planning: たぬ姉（計画役） … 記録・目標
 */

import type { CharacterRole } from "@/shared/character-rules";

export interface LoginMessage {
  id: string;
  character: "rinku" | "konta" | "tanune";
  /** キャラクターの役割（main / community / planning） */
  role: CharacterRole;
  message: string;
  characterImagePath: string;
}

export const LOGIN_MESSAGES: LoginMessage[] = [
  {
    id: "rinku_1",
    character: "rinku",
    role: "main",
    message: "Xログインのあと、このすれ違い通信に戻ってくるよ。",
    characterImagePath: "../assets/images/characters/link/link-yukkuri-smile-mouth-open.png",
  },
  {
    id: "rinku_2",
    character: "rinku",
    role: "main",
    message: "kimito.link と同じアカウントで、足あとと封筒をつなぐね。",
    characterImagePath: "../assets/images/characters/link/link-yukkuri-smile-mouth-open.png",
  },
  {
    id: "konta_1",
    character: "konta",
    role: "community",
    message: "Xの公式画面で確認したら、またここに帰ってこよう！",
    characterImagePath: "../assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png",
  },
  {
    id: "konta_2",
    character: "konta",
    role: "community",
    message: "知らない画面に見えても大丈夫、ログインのための外部認証だよ。",
    characterImagePath: "../assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png",
  },
  {
    id: "tanune_1",
    character: "tanune",
    role: "planning",
    message: "すれ違い記録をあなたのアカウントに保存するための確認です。",
    characterImagePath: "../assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png",
  },
];

/**
 * ランダムにメッセージを選択
 */
export function getRandomLoginMessage(): LoginMessage {
  const randomIndex = Math.floor(Math.random() * LOGIN_MESSAGES.length);
  return LOGIN_MESSAGES[randomIndex];
}
