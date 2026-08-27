#!/usr/bin/env node
// Android「未署名 AAB 出荷事故」防止ゲート。
//
// 背景（出典: Exosome android-play-release.yml で実証）:
//   bubblewrap は build.gradle に signingConfig を生成しないため、そのままビルドすると
//   未署名 AAB ができ、Play Console がアップロードを弾く。CI/ローカルの bundleRelease の
//   「前」にこのチェックを通すことで、Play に弾かれる前に検出して止められる。
//   android-patch-signing.mjs を流せば signingConfig は注入される（このスクリプトはその検証）。
//
// 使い方:
//   node scripts/verify-android-signing-config.mjs
//   node scripts/verify-android-signing-config.mjs --gradle android-twa/app/build.gradle
//
// 既定パスは Capacitor/TWA 標準構成。アプリ固有値は持たない。完全に汎用。
import fs from 'node:fs';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function fail(msg) { console.error(`::error::${msg}`); process.exit(1); }


/**
 * ★Groovy のコメントを除く（2026-08-27 に kimitolink-linktree から輸入）。
 *
 * ★輸入した理由（毒テストで実測）: これが無いと
 *   `// signingConfig signingConfigs.release` と**コメントに書くだけ**で
 *   この門番が exit 0「署名済み AAB が生成されます」と答えた。
 *   実体は `signingConfig signingConfigs.debug`＝デバッグ鍵。
 *   ★本番CI(android-play-release.yml:218)に配線済みの門番が嘘をつく状態だった。
 *   出どころ: kimitolink-linktree/scripts/app/verify-android-signing-config.mjs
 */
export function stripGroovyComments(text) {
  return String(text)
    .replace(/\/\*[\s\S]*?\*\//g, '')      // ブロックコメント
    .replace(/(^|[^:])\/\/.*$/gm, '$1');   // 行コメント（URL の // は残す）
}

/**
 * ★波括弧の深さで、名前付きブロックの中身だけを切り出す。
 *
 * ★輸入した理由: 「`buildTypes {` から末尾まで」を見ると
 *   **debug{} 側の記述で誤って緑**になる。release ブロックだけを見る必要がある。
 *   閉じ括弧が足りない（＝壊れている）場合は null を返し、緑にしない。
 */
export function extractBlock(text, name) {
  // ★テンプレートリテラル内なので \w \s は二重にする（\\w \\s）。
  //   一重だと RegExp に届く前に解釈され、ブロックを見つけられない。
  const re = new RegExp(`(^|[^\\w.])${name}\\s*\\{`, 'm');
  const m = String(text).match(re);
  if (!m) return null;
  let i = m.index + m[0].length;
  let depth = 1;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  if (depth !== 0) return null; // ★閉じていない＝壊れている。緑にしない
  return text.slice(m.index + m[0].length, i - 1);
}

const GRADLE = arg('--gradle', 'android-twa/app/build.gradle');
if (!fs.existsSync(GRADLE)) fail(`${GRADLE} が存在しません。`);
const src = fs.readFileSync(GRADLE, 'utf8');

if (!/signingConfigs\s*\{/.test(src)) {
  console.error(`::error::${GRADLE} に 'signingConfigs' ブロックがありません。`);
  console.error('AAB が署名されず Play Console に弾かれます。');
  console.error("signingConfigs { release { storeFile / storePassword / keyAlias / keyPassword } } を追加し、");
  console.error('buildTypes.release 内で signingConfig signingConfigs.release を指定してください。');
  console.error('（android-patch-signing.mjs で自動注入できます）');
  process.exit(1);
}

// ★buildTypes の release ブロック**だけ**を、コメントを除いてから見る。
const clean = stripGroovyComments(src);
const buildTypes = extractBlock(clean, 'buildTypes');
if (buildTypes === null) {
  console.error(`::error::${GRADLE} に buildTypes ブロックが見つかりません（または閉じ括弧が壊れています）。`);
  console.error('★これは「署名済み」の意味ではありません。測れていません。');
  process.exit(1);
}
const releaseBlock = extractBlock(buildTypes, 'release');
if (releaseBlock === null) {
  console.error(`::error::${GRADLE} の buildTypes に release ブロックがありません。`);
  process.exit(1);
}
if (!/signingConfig\s+signingConfigs\.release/.test(releaseBlock)) {
  console.error(`::error::${GRADLE} の buildTypes.release が signingConfig を参照していません。`);
  console.error('buildTypes { release { ... signingConfig signingConfigs.release } } を追加してください。');
  console.error('★コメント行は数えません（コメントに書くだけでは署名されないため）。');
  process.exit(1);
}

console.log('signingConfig check: OK（署名済み AAB が生成されます）');
