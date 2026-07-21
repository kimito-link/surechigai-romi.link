/** 全ページ監査 — ルート定義 */

export type AuditRoute = {
  path: string;
  label: string;
  /** 本文に含まれるべき文言（いずれか） */
  expectText: RegExp;
  /** ゲストでアクセス可 */
  guestOk: boolean;
  /** 認証必須（guest では skip or ログイン誘導のみ） */
  authPreferred?: boolean;
  /** Clerk iframe 等 — ヘッダー被りチェックを省略 */
  skipHeaderOverlap?: boolean;
  /** console.error 監視を省略（Clerk / 静的 LP 等） */
  skipSmokeClean?: boolean;
};

export const TAB_ROUTES: AuditRoute[] = [
  {
    path: "/",
    label: "ポスト",
    expectText: /会いたい君がいる現在地|封筒と足あと|移動の足あと/,
    guestOk: true,
  },
  {
    path: "/checkin",
    label: "チェックイン",
    expectText: /今いる場所を、あとで行ける精度で残す|現在地を記録する/,
    guestOk: true,
  },
  {
    path: "/events",
    label: "集まり",
    expectText: /主催・ライブ表明|予定/,
    guestOk: true,
  },
  {
    path: "/zukan",
    label: "現在地",
    expectText: /会いたい君がいる現在地|あなたの記録/,
    guestOk: true,
  },
  {
    path: "/map",
    label: "軌跡",
    expectText: /足あとが地図に刻まれ|移動の軌跡|足あと.*件を記録中/,
    guestOk: true,
  },
  {
    path: "/mypage",
    label: "マイページ",
    expectText: /あなたの足あとと公開範囲|プロフィール|いまやること/,
    guestOk: true,
  },
];

export const EXTRA_ROUTES: AuditRoute[] = [
  { path: "/sign-in", label: "サインイン", expectText: /./, guestOk: true, skipHeaderOverlap: true, skipSmokeClean: true },
  { path: "/lp/", label: "LP", expectText: /君斗|すれ違|kimito/i, guestOk: true, skipHeaderOverlap: true, skipSmokeClean: true },
  {
    path: "/auth/kimito-link",
    label: "Xログイン案内",
    expectText: /.*/,
    guestOk: true,
    skipHeaderOverlap: true,
    skipSmokeClean: true,
  },
  {
    path: "/install-instructions",
    label: "PWAインストール",
    expectText: /インストール|ホーム画面|PWA/i,
    guestOk: true,
    skipSmokeClean: true,
  },
  {
    path: "/zukan/東京都",
    label: "都道府県別（東京）",
    expectText: /東京都|クリエイター|都道府県/,
    guestOk: true,
  },
  {
    path: "/visit",
    label: "グループ訪問",
    expectText: /グループ内の訪問を見える化|GROUP VISIT/,
    guestOk: true,
    skipSmokeClean: true,
  },
];

/** ErrorBoundary / 致命的 inline エラー検出用 */
export const FATAL_ERROR_PATTERNS = [
  /^エラーが発生しました$/,
  /予期しないエラーが発生しました/,
];
