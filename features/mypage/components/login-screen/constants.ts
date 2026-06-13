/**
 * ログイン画面の定数とパターンデータ
 */

import { mypageGradient, mypageAccent } from "../../ui/theme/tokens";
import type { CharacterInfo } from "@/components/ui/character-detail-modal";

// キャラクター画像（りんく・こん太・たぬ姉のオリジナル画像を統一使用）
export const characterImages = {
  rinku: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  konta: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanune: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
  linkFull: require("@/assets/images/characters/KimitoLink.png"),
  linkIdol: require("@/assets/images/characters/idolKimitoLink.png"),
  linkYukkuri: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  kontaYukkuri: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  tanuneYukkuri: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
};

// ロゴ画像
export const logoImage = require("@/assets/images/logo/logo-maru-orange.jpg");

// キャラクター詳細情報
export const characterDetails: Record<string, CharacterInfo> = {
  link: {
    id: "link",
    name: "りんく",
    gender: "female",
    image: characterImages.linkYukkuri,
    description: "動員ちゃれんじの主人公。みんなの応援を集めて、推しの夢を叶えるお手伝いをしています。",
    personality: "明るく元気で、いつもポジティブ。みんなを笑顔にするのが大好き。困っている人を見ると放っておけない性格。",
    likes: ["応援すること", "みんなの笑顔", "ライブ", "お祭り"],
    themeColor: mypageAccent.linkPink,
    catchphrase: "みんなの想いを、一つに！",
  },
  konta: {
    id: "konta",
    name: "こん太",
    gender: "male",
    image: characterImages.kontaYukkuri,
    description: "りんくの相棒のキツネ。友達を誘って盛り上げるのが得意。一人の参加が大きな波になることを知っている。",
    personality: "ちょっとイタズラ好きだけど、根は優しい。仲間思いで、みんなを繋げる架け橋になりたいと思っている。",
    likes: ["友達と遊ぶこと", "油揚げ", "お祭りの屋台", "みんなで歌うこと"],
    themeColor: mypageAccent.kontaOrange,
    catchphrase: "一緒に盛り上げよう！",
  },
  tanune: {
    id: "tanune",
    name: "たぬ姉",
    gender: "female",
    image: characterImages.tanuneYukkuri,
    description: "りんくの仲間のタヌキ。チャレンジを作って目標達成を目指すのが好き。計画を立てるのが得意。",
    personality: "のんびり屋さんに見えて、実は計画的。目標を立てて達成するのが大好き。みんなの頑張りを応援している。",
    likes: ["計画を立てること", "お団子", "みんなの成功", "お昼寝"],
    themeColor: mypageAccent.tanuneGreen,
    catchphrase: "目標達成でお祝いしよう！",
  },
};

// ログインパターン型
export interface LoginPattern {
  id: number;
  character: keyof typeof characterImages;
  title: string;
  message: string;
  highlight: string;
  gradientColors: readonly [string, string];
  accentColor: string;
}

// ログイン画面のパターンデータ
export const loginPatterns: LoginPattern[] = [
  {
    id: 1,
    character: "linkIdol",
    title: "みんな、ちょっと聞いて！",
    message: "あなたの「推し」が、大きなステージに立つ瞬間を\n一緒に作りたいんだ。",
    highlight: "その景色を、一緒に作ろう！",
    gradientColors: mypageGradient.linkPink,
    accentColor: mypageAccent.linkPink,
  },
  {
    id: 2,
    character: "linkFull",
    title: "声を届けよう！",
    message: "あなたの応援の声が、\n誰かの心を動かす。",
    highlight: "一緒に推しの夢を叶えよう！",
    gradientColors: mypageGradient.linkPurple,
    accentColor: mypageAccent.linkPurple,
  },
  {
    id: 3,
    character: "linkYukkuri",
    title: "ようこそ！",
    message: "動員ちゃれんじへようこそ！\nみんなの想いを集めて、推しの夢を叶えよう。",
    highlight: "さあ、始めよう！",
    gradientColors: mypageGradient.kontaOrange,
    accentColor: mypageAccent.kontaOrange,
  },
  {
    id: 4,
    character: "kontaYukkuri",
    title: "こん太だよ！",
    message: "友達を誘って、みんなで盛り上げよう！\n一人の参加が、大きな波になるんだ。",
    highlight: "一緒に盛り上げよう！",
    gradientColors: mypageGradient.kontaGold,
    accentColor: mypageAccent.kontaGold,
  },
  {
    id: 5,
    character: "tanuneYukkuri",
    title: "たぬ姉だよ！",
    message: "チャレンジを作って、\nみんなで目標達成を目指そう！",
    highlight: "目標達成でお祝い！",
    gradientColors: mypageGradient.tanuneGreen,
    accentColor: mypageAccent.tanuneGreen,
  },
  {
    id: 6,
    character: "linkIdol",
    title: "ステージへの道！",
    message: "客席を埋め尽くすファンの声援、\nリアルタイムで流れる応援コメント…",
    highlight: "その感動を、一緒に！",
    gradientColors: mypageGradient.tanunePink,
    accentColor: mypageAccent.tanunePink,
  },
];

// ランダムにパターンを選択する関数
export const getRandomPattern = (): LoginPattern => {
  return loginPatterns[Math.floor(Math.random() * loginPatterns.length)];
};
