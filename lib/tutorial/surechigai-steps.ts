/**
 * 君斗りんく — ログイン後チュートリアル v3（タブ対応・ライト UI）
 */
import type { TutorialStep } from "@/components/organisms/tutorial-overlay";

export const SURECHIGAI_TUTORIAL_STEPS: TutorialStep[] = [
  {
    message: "この画面に\n封筒が届く",
    subMessage: "「現在地」タブ — 同じ場所を通った人との記録。未開封は地図上にも表示",
    character: "rinku_smile",
    speech: "すれ違ったら封筒が積み上がるよ。タップで開ける！",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "envelope",
  },
  {
    message: "チェックインで\n足あとを残す",
    subMessage: "下の「チェックイン」タブ — いまいる場所を1タップで記録",
    character: "konta_smile",
    speech: "記録しないとすれ違いも始まらない。まずここから！",
    tapToContinue: true,
    successAnimation: "pulse",
    previewType: "checkin",
  },
  {
    message: "みんなの\n現在地マップ",
    subMessage: "「みんなの現在地」タブ — 公開中の人がどの都道府県にいるか",
    character: "tanune_smile",
    speech: "推しがどこにいるか、先にわかるとうれしいわね。",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "map",
  },
  {
    message: "「ここへ向かう」\nで再訪",
    subMessage: "「軌跡」タブ — 足あと行のボタンから Google マップ等のナビを開始",
    character: "rinku_smile",
    speech: "思い出の場所・聖地に、地図アプリでそのまま向かえるよ。",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "navigate",
  },
  {
    message: "集まりの\n予定とライブ",
    subMessage: "「集まり」タブ — カレンダーで予定を見て、ライブ中の場所も追える",
    character: "konta_smile",
    speech: "予定はゲストでも見られる。主催はログイン後に作成できるよ。",
    tapToContinue: true,
    successAnimation: "sparkle",
    previewType: "events",
  },
  {
    message: "準備\nできました",
    subMessage: "まずチェックイン。交流はXへ — アプリ内は一方向の合図だけ",
    character: "tanune_smile",
    speech: "移動専用Xアカウントもおすすめ。さあ、行こう！",
    tapToContinue: true,
    successAnimation: "confetti",
    previewType: "none",
  },
];
