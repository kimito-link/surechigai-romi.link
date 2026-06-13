/**
 * キャラクター表示ルール
 * りんくが主役であることを型レベルで強制
 * こん太とたぬ姉の役割を明確化
 */

export type MainCharacter = "rinku";
export type SupportingCharacter = "konta" | "tanune";
export type Character = MainCharacter | SupportingCharacter;

/**
 * キャラクターの役割
 */
export type CharacterRole =
  | "main" // りんく: 主役
  | "community" // こん太: 盛り上げ・コミュニティ
  | "planning"; // たぬ姉: 計画・目標設定

/**
 * キャラクターの役割を取得
 */
export function getCharacterRole(character: Character): CharacterRole {
  switch (character) {
    case "rinku":
      return "main";
    case "konta":
      return "community";
    case "tanune":
      return "planning";
  }
}

/**
 * ログインメッセージ用のキャラクター選択
 * りんくが主役なので、デフォルトはりんく
 * ただし、メッセージの内容に応じてこん太やたぬ姉も使用可能
 */
export function selectCharacterForLogin(
  messageType?: "community" | "planning"
): Character {
  if (messageType === "community") {
    return "konta";
  }
  if (messageType === "planning") {
    return "tanune";
  }
  return "rinku"; // デフォルトはりんく
}

/**
 * メインキャラクター（りんく）を取得
 */
export function getMainCharacter(): MainCharacter {
  return "rinku";
}

/**
 * 主役キャラクターかどうかを判定
 */
export function isMainCharacter(
  character: Character
): character is MainCharacter {
  return character === "rinku";
}
