#!/usr/bin/env node
/**
 * scripts/qa/check-missing-assets-404.mjs
 *
 * ★存在しない静的ファイルが「404」を返すことを本番で検査する。
 *
 * ■ なぜ必要か（2026-09-06 実障害・オーナーの実機で発生）
 *   本番を開くと画面中央に
 *     「Loading module https://surechigai.kimito.link/_expo/static/js/web/sign-in-….js」
 *   と出て止まり、「再試行」を押しても直らなかった。
 *
 *   真因は**コードではなく配信**だった。実測:
 *     /_expo/static/js/web/sign-in-DEADBEEF.js → 200 / text/html / index.html と同一バイト
 *     /assets/NOPE.png                          → 200 / text/html
 *     /fonts/NOPE.woff2                         → 200 / text/html
 *   dist/404.html が無いため、Vercel がどのルートにも当たらないパスへ
 *   トップページの HTML を **HTTP 200** で返していた。
 *
 *   ブラウザは HTML を ES module として実行できないので「Loading module failed」になる。
 *   さらに Cache-Control: immutable が付くため、**リロードしても1年間直らない**。
 *
 * ■ ★この検査が無いと気づけない理由
 *   200 が返るので、死活監視も curl -I も「正常」と答える。
 *   素材が消えても 200 なので、**壊れたことに気づく手段が無い**。
 *   このリポは同じ型で繰り返し刺されている:
 *     - scripts/qa/axe-a11y-check.mjs:38 「SPAは存在しないパスでも200を返すので
 *       404画面にaxeを回していた」＝同じ罠を既に踏んだ記録がある
 *     - OGP が 200/image/png のまま 0 バイト（size を見るまで不明）
 *
 * ■ 判定
 *   実在しないファイル名を叩き、**ステータスと Content-Type の両方**を見る。
 *   ★200 が返ったら赤。JS を頼んで text/html が返っても赤。
 *
 * ■ ★この検査が判定しないこと
 *   - 実在するファイルの中身が正しいか（→ check-splash-served.mjs が担当）
 *   - 端末に既にキャッシュされた壊れた応答（サーバーを直しても
 *     immutable で保持している端末は残る。SW側の防御が別途要る）
 *
 * 使い方:
 *   node scripts/qa/check-missing-assets-404.mjs [https://surechigai.kimito.link]
 *   ※実ネットワークを叩くので pnpm check には入れない。デプロイ後に回す。
 */
import { computeExitCode, formatProbeReport } from "../lib/instrument-core.mjs";

const BASE = process.argv[2] ?? "https://surechigai.kimito.link";

/** 実在しないことが確実なパス（ランダム性を入れて偶然の一致を避ける） */
const NONCE = `NOPE-${Date.now().toString(36)}`;
const TARGETS = [
  {
    path: `/_expo/static/js/web/sign-in-${NONCE}.js`,
    what: "JSチャンク",
    // ★JSを頼んで text/html が返ると「Loading module failed」で画面が固まる
    forbidContentType: "text/html",
  },
  { path: `/assets/${NONCE}.png`, what: "画像アセット" },
  { path: `/fonts/${NONCE}.woff2`, what: "フォント" },
];

const HOW_TO_FIX =
  "dist/404.html を出力する（scripts/emit-404.cjs が vercel-build.sh から呼ばれているか確認）。" +
  " Vercel は出力先の 404.html を、どのルートにも一致しないパスへ 404 ステータスで返す。";
const LIMITATION =
  "実在するファイルの中身が正しいかは見ない。また、既に壊れた応答を immutable で" +
  "キャッシュしている端末は、サーバーを直しても手元では直らない。";

async function probe(target) {
  const url = `${BASE}${target.path}`;
  let res;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch (error) {
    // ★通信できなかった＝測れていない。緑にも赤にもしない。
    return {
      probe: target.what,
      verdict: "inconclusive",
      detail: `${url} に接続できませんでした: ${error.message}`,
      howToFix: "ネットワークと本番URLを確認してから再実行してください。",
    };
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (res.status === 200) {
    return {
      probe: target.what,
      verdict: "fail",
      detail:
        `${target.path} が 404 ではなく ${res.status} を返しました` +
        `（Content-Type: ${contentType || "不明"}）。存在しないのに「ある」と答えています。`,
      howToFix: HOW_TO_FIX,
      limitation: LIMITATION,
    };
  }

  // ★404 を返しているなら Content-Type は問わない。
  //   404ページ自体はHTMLで正しく、ブラウザは 404 を見て「取得失敗」と扱うので
  //   ES module として実行しようとはしない。
  //   見たいのは「200 で HTML を掴まされる」ケース（それがこの不具合の実体だった）。
  if (
    res.status === 200 &&
    target.forbidContentType &&
    contentType.toLowerCase().includes(target.forbidContentType)
  ) {
    return {
      probe: target.what,
      verdict: "fail",
      detail:
        `${target.path} の Content-Type が ${contentType} でした。` +
        "JSを要求しているのにHTMLが返ると、ブラウザは ES module として実行できず固まります。",
      howToFix: HOW_TO_FIX,
      limitation: LIMITATION,
    };
  }

  // ★根拠(evidence)を付けないと instrument-core が pass を名乗らせない。
  //   「測った証拠のない緑」を作らないための土台側の仕組み。
  return {
    probe: target.what,
    verdict: "pass",
    detail: `${target.path} → ${res.status}（期待どおり存在しないと答えた）`,
    evidence: {
      url,
      status: res.status,
      contentType: contentType || null,
      cacheControl: res.headers.get("cache-control") ?? null,
      verifiedAt: new Date().toISOString(),
    },
  };
}

const results = await Promise.all(TARGETS.map(probe));
console.log(formatProbeReport(results, { label: "check-missing-assets-404" }));
process.exit(computeExitCode(results));
