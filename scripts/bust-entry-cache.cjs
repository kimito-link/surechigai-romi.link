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
  process.env.COMMIT_SHA ||
  "local";
const version = `${versionBase}-${Date.now()}`.replace(/[^0-9a-zA-Z._-]/g, "-");

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
const re = /(\/_expo\/static\/js\/web\/entry-[a-f0-9]+\.js)(\?v=[^"']*)?/g;
for (const file of htmlFiles) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(re, `$1?v=${version}`);
  if (after !== before) {
    fs.writeFileSync(file, after);
    patched++;
  }
}
console.log(`[bust-entry-cache] version=${version} html_patched=${patched}`);
