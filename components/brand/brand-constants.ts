/**
 * ブランド名称・ロゴ — UI 全体で統一（サービス名の記憶定着用）
 */

export const PRODUCT_NAME = "君斗りんくのすれ違ひ通信";
export const PRODUCT_NAME_SHORT = "君斗りんく";
export const PRODUCT_SUBTITLE = "すれ違ひ通信";
export const PARENT_BRAND = "Kimito Link";
export const PARENT_BRAND_JA = "キミトリンク";
export const PARENT_PROJECT = "Kimito-Link Project";
export const PARENT_SITE_URL = "https://kimito-link.com";

export const KIMITO_LINK_LOGO = require("@/assets/images/logos/kimitolink-logo.webp");

export const BRAND_CHARACTERS = [
  require("@/assets/images/characters/konta.png"),
  require("@/assets/images/characters/rinku.png"),
  require("@/assets/images/characters/tanune.png"),
] as const;

/**
 * BRAND_CHARACTERS と同じ並びのキャラ名。
 * expo-image の Web 実装は通常表示で accessibilityLabel しか見ないため、
 * これを渡して <img alt> を出す（axe: image-alt）。空文字は falsy で消える。
 */
export const BRAND_CHARACTER_NAMES = ["こんた", "りんく", "たぬね"] as const;
