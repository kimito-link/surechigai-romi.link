/**
 * ログインで「途中で止まった」ときの、一般ユーザー向けの案内（正本）。
 * kimitolink-linktree/lib/login-help.ts と同一。
 */

export type LoginHelpItem = {
  lead: string;
  body: string;
};

export const LOGIN_HELP_STEPS: readonly LoginHelpItem[] = [
  {
    lead: "LINE や X のアプリの中で開いているとき",
    body: "いったん、ふつうのブラウザ（Safari や Chrome）で開き直すと、すんなり進むことが多いです。アプリの中のブラウザは、ログインがうまく続かないことがあります。",
  },
  {
    lead: "X の画面が真っ暗なまま進まないとき",
    body: "少し時間をおいてから、もう一度「X で続ける」を押してみてください。X 側が混み合っていると、しばらくして直ることがあります。",
  },
  {
    lead: "それでも進まないとき",
    body: "いつもと違うブラウザや、ブラウザのシークレット（プライベート）ウィンドウで、このログイン画面をもう一度開いてみてください。先に X にログインしておくと、よりスムーズです。",
  },
] as const;

export const LOGIN_HELP_INTRO =
  "うまく進まなくても、あなたのせいではありません。下のことを順番に試すと、たいていうまくいきます。";
