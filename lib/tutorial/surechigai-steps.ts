/**
 * 君斗りんく — ログイン後チュートリアル（4ステップ・UIガイド）
 */
import type { TutorialStep } from "@/components/organisms/tutorial-overlay";

export const SURECHIGAI_TUTORIAL_STEPS: TutorialStep[] = [
  {
    message: "チェックインで\n足あとを残す",
    subMessage: "下の「チェックイン」タブ — 今いる場所を1タップで記録",
    character: "rinku_smile",
    speech: "難しいことはないよ。ここにいる、だけで始まる！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "checkin",
  },
  {
    message: "すれ違うと\n封筒が届く",
    subMessage: "同じ場所を通った人との記録 — 交流はXへ",
    character: "konta_smile",
    speech: "アプリ内は一方向の合図だけ。DMはないよ。",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "pulse",
    previewType: "envelope",
  },
  {
    message: "みんなの\n現在地が見える",
    subMessage: "「現在地」タブ — 公開中の都道府県マップ",
    character: "tanune_smile",
    speech: "いま誰がどこにいるか、先にわかるのがうれしいわね。",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "map",
  },
  {
    message: "軌跡を\nあとからたどる",
    subMessage: "「軌跡」タブ — 正確な地図と市区町村図鑑",
    character: "idol",
    speech: "移動専用Xアカウントの利用もおすすめ。さあ、行こう！",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "confetti",
    previewType: "trail",
  },
];
