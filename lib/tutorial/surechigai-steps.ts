/**
 * 君斗りんく — ログイン後チュートリアル（UIガイド）
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
    subMessage: "「軌跡」タブ — 地図・図鑑・「ここへ向かう」ナビ",
    character: "rinku_smile",
    speech: "あの場所にもう一度行けるの、うれしい。",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "trail",
  },
  {
    message: "集まりの\n予定が見える",
    subMessage: "「集まり」タブ — カレンダーとライブ中",
    character: "konta_smile",
    speech: "ライブ表明で、いまどこにいるか先にわかるよ。",
    messagePosition: "center",
    tapToContinue: true,
    successAnimation: "confetti",
    previewType: "notification",
  },
];
