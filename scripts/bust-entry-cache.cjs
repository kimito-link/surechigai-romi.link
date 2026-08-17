/**
 * dist/*.html 内の entry スクリプト参照に ?v=<版数> を付与して、
 * ブラウザが immutable キャッシュした古い entry を確実に再取得させる。
 *
 * 背景: Expo Web export の entry チャンクは、参照する async ルートチャンクの
 * ハッシュが変わってもファイル名(entry-<hash>.js)が変わらないことがある。
 * その entry が `Cache-Control: immutable` で1年キャッシュされるため、過去に壊れた
 * /sign-in を踏んだブラウザは新ビルド配信後も古い entry を使い続けて白画面のままになる。
 * index.html は must-revalidate なので、entry の URL にビルド毎に変わるクエリを付ければ
 * 必ず最新 entry を取りに行く（=最新の正しい async チャンクを読む）。
 */
const fs = require("fs");
const path = require("path");

const DIST = path.join(process.cwd(), "dist");
const versionBase =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  "local";
// 2026-08-17 障害: 本番の全ページが白画面になった。
// ある1つのチャンクURL（?v=<sha>-<Date.now()> 付き）に対して
// Cloudflare が SPA の HTML を cf-cache-status: HIT で配信し続けており、
// ブラウザは text/html を JS として実行できず
// "Refused to execute script" → "Requiring unknown module" で停止していた。
//
// 注意: 「タイムスタンプ付きの形式なら必ず壊れる」わけではない。
// 事後に同形式の別URLを叩くと正しく application/javascript が返る。
// この仕組み自体は 2026-06-27 から 566 コミット分稼働している。
// 壊れたのは特定URLに対する Cloudflare のキャッシュ内容であり、
// 根本原因は CDN 側の挙動。ここでの対処は再発確率を下げるもので、
// 同じことが SHA のみの URL でも起こりうる。
//
// Date.now() を外す理由: デプロイの度に新しいURLが生まれると、
// 「まだ誰も踏んでいない＝CDNが何を掴むか分からないURL」を毎回作ることになる。
// SHA だけなら同一ビルドで同じURLに収束する（中身も同じなので割る必要がない）。
//
// 白画面を見たら version.json やデプロイ成功ではなく、
// 実ブラウザで chunk の content-type を見ること（curl では両方 JS に見える）。
const version = String(versionBase).replace(/[^0-9a-zA-Z._]/g, "");

function listHtml(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

if (!fs.existsSync(DIST)) {
  console.log("[bust-entry-cache] dist not found, skip");
  process.exit(0);
}

let patched = 0;
const htmlFiles = listHtml(DIST, []);
// entry だけでなく HTML が参照する全チャンクに付与する。
// 2026-07-04 障害: _layout チャンクも「同名・別内容」になり得る
// （Metro は参照先 async チャンクのURLをファイル名ハッシュに含めない）ため、
// entry 限定だと _layout 経由で旧コード（旧 clerk-root-provider 等）が
// ブラウザ/CDN の immutable キャッシュから配信され続けた。
const re = /(\/_expo\/static\/js\/web\/[A-Za-z0-9_\[\]().+-]+\.js)(\?v=[^"']*)?/g;
for (const file of htmlFiles) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(re, `$1?v=${version}`);
  if (after !== before) {
    fs.writeFileSync(file, after);
    patched++;
  }
}
console.log(`[bust-entry-cache] version=${version} html_patched=${patched}`);
