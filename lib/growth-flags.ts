/**
 * 成長施策（CVR / CPA）の段階リリース用フラグ。
 *
 * ★すべて既定 OFF（＝従来の挙動）。EXPO_PUBLIC_* はビルド時に埋め込まれるため、
 *   切り替えは Vercel / EAS の環境変数を変えて再ビルドする。
 *   値は "true" のときだけ有効（タイポで勝手に ON にならない）。
 */

/**
 * マイページに「足あとを書き出す（GPX / GeoJSON）」行を出す。
 * 未加入者は /premium?from=export へ（docs/monetization-DESIGN.md B-4 / D-5）。
 *
 * 既定 OFF の理由: app/premium.tsx の PURCHASE_AVAILABLE が false の間は
 * 購入まで進めないため。RevenueCat を有効にするのと同時に ON にする想定。
 */
export function isPremiumExportEntryEnabled(): boolean {
  return process.env.EXPO_PUBLIC_PREMIUM_EXPORT_ENTRY === "true";
}

/**
 * チェックイン直後のシェア文面に「N人とすれ違った」を入れる。
 * すれ違いが届いた瞬間は最も共有したくなる瞬間で、件数は未インストールの人への
 * 「ここに人がいる」という具体的な証拠になる（＝紹介経由の獲得単価を下げる狙い）。
 */
export function isShareEncounterCopyEnabled(): boolean {
  return process.env.EXPO_PUBLIC_SHARE_ENCOUNTER_COPY === "true";
}
