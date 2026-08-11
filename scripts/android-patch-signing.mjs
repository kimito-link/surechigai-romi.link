#!/usr/bin/env node
// release ビルドに upload key の signingConfig を差し込む（冪等）。
//
// 対応する2方式:
//   - Expo prebuild  : android/app/build.gradle       ← 現行（2026-08 以降）
//   - TWA/bubblewrap : android-twa/app/build.gradle   ← 旧方式
//
// どちらも release 用の signingConfig を生成しないため、そのまま bundleRelease すると
// debug 署名の AAB ができ、Play Console に
// 「アップロードしたすべてのバンドルに署名する必要があります」で弾かれる。
//
// 使い方:
//   node scripts/android-patch-signing.mjs --gradle android/app/build.gradle
//   （--gradle 省略時は android/ → android-twa/ の順に自動検出）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

/** --gradle が無ければ、実在する方を選ぶ（Expo prebuild を優先） */
function resolveGradlePath() {
  const explicit = arg('--gradle', null);
  if (explicit) return path.resolve(REPO, explicit);
  for (const rel of [
    ['android', 'app', 'build.gradle'],
    ['android-twa', 'app', 'build.gradle'],
  ]) {
    const p = path.join(REPO, ...rel);
    if (fs.existsSync(p)) return p;
  }
  return path.join(REPO, 'android', 'app', 'build.gradle');
}

const GRADLE = resolveGradlePath();

if (!fs.existsSync(GRADLE)) {
  console.error(`Not found: ${GRADLE}`);
  console.error('先に `npx expo prebuild --platform android` を実行してください。');
  process.exit(1);
}
console.log(`android-patch-signing: target = ${path.relative(REPO, GRADLE)}`);

let src = fs.readFileSync(GRADLE, 'utf8');

// --- 1. Already patched? ---
if (src.includes('signingConfigs') && src.includes('signingConfig signingConfigs.release')) {
  console.log('android-patch-signing: already patched, nothing to do.');
  process.exit(0);
}

// --- 2. Inject keystore.properties loader before `android {` ---
const KEYSTORE_LOADER = `\
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

if (!src.includes('keystorePropertiesFile')) {
  src = src.replace(/^(android\s*\{)/m, `${KEYSTORE_LOADER}$1`);
  console.log('android-patch-signing: injected keystore.properties loader.');
}

// --- 3. Inject signingConfigs block inside `android {` ---
const SIGNING_CONFIGS = `\
    signingConfigs {
        release {
            storeFile file("../android-upload-key.jks")
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
`;

// ⚠️ Expo prebuild が生成する build.gradle は **すでに** `signingConfigs { debug {...} }` を
//    持っている。`!src.includes('signingConfigs')` で判定すると false になり、
//    release 用ブロックが入らないまま「done」と出てしまう（実際に踏んだ）。
//    そのため「release ブロックがあるか」で判定する。
if (!/signingConfigs\s*\{[\s\S]*?\brelease\s*\{/.test(src)) {
  if (/signingConfigs\s*\{/.test(src)) {
    // 既存の signingConfigs に release だけ足す
    src = src.replace(
      /(signingConfigs\s*\{)/,
      `$1
        release {
            storeFile file("../android-upload-key.jks")
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }`,
    );
    console.log('android-patch-signing: added release to existing signingConfigs.');
  } else {
    src = src.replace(/^(android\s*\{)/m, `$1\n${SIGNING_CONFIGS}`);
    console.log('android-patch-signing: injected signingConfigs block.');
  }
}

// --- 4. buildTypes.release を release 署名に向ける ---
// Expo 生成物は release ブロック内が `signingConfig signingConfigs.debug` になっている。
// **追記ではなく置換**しないと debug 署名が残り、本番AABがデバッグ鍵で署名されてしまう。
const releaseBlock = /(buildTypes\s*\{[\s\S]*?\brelease\s*\{)([\s\S]*?)(\n\s*\})/;
const m = src.match(releaseBlock);
if (m) {
  let body = m[2];
  if (/signingConfig\s+signingConfigs\.debug/.test(body)) {
    body = body.replace(/signingConfig\s+signingConfigs\.debug/g, 'signingConfig signingConfigs.release');
    console.log('android-patch-signing: switched release buildType from debug to release signing.');
  } else if (!/signingConfig\s+signingConfigs\.release/.test(body)) {
    body = `\n            signingConfig signingConfigs.release${body}`;
    console.log('android-patch-signing: added signingConfig reference to buildTypes.release.');
  }
  src = src.replace(releaseBlock, `$1${body}$3`);
}

// --- 5. 書き込む前に、狙った状態になったか自分で検証する ---
// 「パッチした」と言いながら実際は当たっていない、を防ぐ（一度これで騙された）。
const problems = [];
if (!/signingConfigs\s*\{[\s\S]*?\brelease\s*\{/.test(src)) {
  problems.push('signingConfigs に release ブロックが無い');
}
const after = src.match(releaseBlock);
if (!after) {
  problems.push('buildTypes.release ブロックを特定できない');
} else {
  if (!/signingConfig\s+signingConfigs\.release/.test(after[2])) {
    problems.push('buildTypes.release が signingConfigs.release を参照していない');
  }
  if (/signingConfig\s+signingConfigs\.debug/.test(after[2])) {
    problems.push('buildTypes.release に debug 署名が残っている（本番がデバッグ鍵で署名される）');
  }
}
if (problems.length) {
  for (const p of problems) console.error(`::error::android-patch-signing: ${p}`);
  process.exit(1);
}

fs.writeFileSync(GRADLE, src, 'utf8');
console.log('android-patch-signing: done. build.gradle is ready for signed bundleRelease.');
