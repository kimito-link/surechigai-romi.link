// components/organisms/tutorial-overlay/types.ts
// v6.18: チュートリアルの型定義

// キャラクター画像のマッピング（表情バリエーション）
export const CHARACTER_IMAGES = {
  // りんくちゃん
  rinku_normal: require("@/assets/images/characters/link/link-yukkuri-normal-mouth-open.png"),
  rinku_smile: require("@/assets/images/characters/link/link-yukkuri-smile-mouth-open.png"),
  rinku_blink: require("@/assets/images/characters/link/link-yukkuri-blink-mouth-open.png"),
  rinku_thinking: require("@/assets/images/characters/link/link-yukkuri-half-eyes-mouth-closed.png"),
  // こん太
  konta_normal: require("@/assets/images/characters/konta/kitsune-yukkuri-normal.png"),
  konta_smile: require("@/assets/images/characters/konta/kitsune-yukkuri-smile-mouth-open.png"),
  konta_blink: require("@/assets/images/characters/konta/kitsune-yukkuri-blink-mouth-open.png"),
  // たぬ姉
  tanune_normal: require("@/assets/images/characters/tanunee/tanuki-yukkuri-normal-mouth-open.png"),
  tanune_smile: require("@/assets/images/characters/tanunee/tanuki-yukkuri-smile-mouth-open.png"),
  tanune_blink: require("@/assets/images/characters/tanunee/tanuki-yukkuri-blink-mouth-open.png"),
  // 君斗りんく（メイン）
  kimitolink: require("@/assets/images/characters/KimitoLink.png"),
  idol: require("@/assets/images/characters/idolKimitoLink.png"),
};

export type CharacterKey = keyof typeof CHARACTER_IMAGES;

export type TutorialStep = {
  /** 画面に表示する一言（12文字以内推奨） */
  message: string;
  /** サブメッセージ（メリットの説明） */
  subMessage?: string;
  /** キャラクター */
  character?: CharacterKey;
  /** セリフ（キャラクターの吹き出し） */
  speech?: string;
  /** アイコンタイプ（レガシー互換） */
  icon?: string;
  /** ハイライトする要素の位置（指定しない場合は中央表示） */
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
    /** 丸型ハイライトにするか */
    circular?: boolean;
  };
  /** メッセージの表示位置 */
  messagePosition?: "top" | "bottom" | "center";
  /** タップで次に進むか（falseの場合は特定のアクションを待つ） */
  tapToContinue?: boolean;
  /** 成功時のアニメーション */
  successAnimation?: "confetti" | "pulse" | "sparkle" | "none";
  /** プレビュー画像タイプ */
  previewType?: "map" | "participants" | "chart" | "notification" | "crown" | "none";
};

export type TutorialOverlayProps = {
  /** 現在のステップ */
  step: TutorialStep;
  /** 現在のステップ番号（1から開始） */
  stepNumber: number;
  /** 総ステップ数 */
  totalSteps: number;
  /** 次のステップに進む */
  onNext: () => void;
  /** チュートリアル終了 */
  onComplete: () => void;
  /** 表示/非表示 */
  visible: boolean;
};
