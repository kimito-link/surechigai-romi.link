/**
 * improvement-metrics.mjs — ★このアプリが見る指標の宣言（★アプリごとにカスタムする）。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★このファイルは【空で始める】
 *   実測してから足す。★実測せずに方向を宣言すると、
 *   ★**正しくない向きを機械で固定**することになる。
 *   （soushin-suggest.link が boundaries.psd1 の Higher = @() を空で始めたのと同じ理由。
 *     ★所有を先に宣言すると、後で人を止める。）
 *
 * ■ ★better（どちらが良いか）は必ず書く。これが設計の要。
 *   実データ（tsuioku の changelog 1,349版から抽出した18件）にはこれがあった:
 *     100% → 0%     ★改善（エラー率が消えた）
 *     2回 → 13回    ★改善（描画が動くようになった）
 *     3秒 → 12秒    ★改善（取りこぼしを無くした）
 *   ★「小さいほど良い」を既定にしていたら、この3件を全部「退化」と誤判定していた。
 *   ＝ ★**正しく直した人を止める**。検査への信頼は一度で消える。
 *
 * ■ ★why（なぜ見るのか）も書く
 *   書けないなら、その指標はまだ「測る価値がある」と言えていない。
 *   ★計器は増やすほど良いのではない（tsuioku は100個まで増やしたが、
 *     真因に導いたのはごく一部だった）。★1本足すたびに「導いたか」で判定し、
 *     導かないものは消す。
 *
 * ■ ★自動で測ってよいのは「リポの中だけで完結する」指標だけ
 *   ✅ 自動にしてよい   … ビルド成果物のサイズ / 検査の本数 / 依存の数
 *   ★自動にしてはいけない … 実機の画面の部品数 / 起動所要 / 通信の速さ
 *   ★実機依存の指標を自動化すると、★測定条件が版ごとに違う数字が
 *     過去最良比較に載る＝★比べてはいけないものを比べることになる。
 *   → そういう指標は**手で書く**。そのかわり source（どこで測ったか）を必須にする。
 * ───────────────────────────────────────────────────────────────────────────
 */

/**
 * @typedef {object} MetricSpec
 * @property {string} id 指標のID(主キー)
 * @property {string} label 人が読む名前
 * @property {'lower'|'higher'} better ★どちらが良いか。数字から推測しない
 * @property {string} unit 単位
 * @property {string} [why] なぜこの指標を見るのか(実損の記録)
 * @property {boolean} [auto] ★リポ内だけで機械が測れるか（record --auto の対象）
 */

/**
 * ★あなたのアプリの指標。**空で始めて、実測してから足す**。
 *
 * 書き方の例（★コメントのまま。実測するまで有効にしない）:
 *
 *   Object.freeze({
 *     id: 'bundle-kb', label: 'バンドルの大きさ', better: 'lower', unit: 'KB',
 *     why: '更新履歴が1,042KB(全体の43%)まで膨れ、親スレッドを1,373ms止めた実事故',
 *     auto: true
 *   })
 *
 * @type {ReadonlyArray<MetricSpec>}
 */
export const IMPROVEMENT_METRICS = Object.freeze([
  /* ★2026-08-23 に実測してから足した3件。実測していない指標は足さない。
     ★どれも「リポの中だけで完結する」ので auto で測ってよい。
     実機依存（起動所要・PageSpeed・実機の部品数）は**入れていない**:
     このリポは PageSpeed スコアが同一コミットで 61〜88（±25）ばらつくことを
     実測済みで、そういう数字を過去最良比較に載せると
     ★測定条件の違いを「退化」と誤判定する。 */

  Object.freeze({
    id: "tests-passed",
    label: "通っているテストの数",
    better: "higher", // ★多いほど良い。「小さいほど良い」既定なら全部退化になる
    unit: "件",
    why:
      "2026-08-21〜22 に却下・実障害を4件直したが、いずれも" +
      "「テストが無かったから気づけなかった」型だった" +
      "（OGP 0バイト / Threads共有の無言false / 却下ゲートの見逃し / 旧スプラッシュ配信）。" +
      "テストを減らす変更を無言で通さないために見る。",
    auto: { kind: 'command-number', cmd: ['node','scripts/qa/count-metric.mjs','tests-passed'] },
  }),

  Object.freeze({
    id: "gates",
    label: "出荷前ゲートの本数",
    better: "higher",
    unit: "本",
    why:
      "2026-08-21 に check-native-unsafe-dom が pnpm check にも CI にも未登録で" +
      "**誰にも実行されていなかった**（iOS 518 却下の検出役だったのに）。" +
      "ゲートが静かに減ることを防ぐ。",
    auto: { kind: 'command-number', cmd: ['node','scripts/qa/count-metric.mjs','gates'] },
  }),

  Object.freeze({
    id: "selftest-missing",
    label: "selftest を持たない検査の数",
    better: "lower", // ★少ないほど良い
    unit: "本",
    why:
      "2026-08-22 に check-tracked-imports が走査0件でも exit 0 を返していた" +
      "（＝何も測っていないのに合格）。検査が壊れても緑になる状態を増やさない。",
    auto: { kind: 'command-number', cmd: ['node','scripts/qa/count-metric.mjs','selftest-missing'] },
  }),
]);
