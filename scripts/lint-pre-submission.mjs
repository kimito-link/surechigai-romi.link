#!/usr/bin/env node
// 移植元: partnership_program_website/scripts/lint-pre-submission.mjs
//   (リバースハック固有の Clerk / partner URL / client・server パスのハードコードを除去し、
//    app.config.json 駆動 + 環境変数オーバーライド + 「ファイルが無ければ skip」に一般化)。
//
// 審査前 lint — このキットで実証済みの Apple 却下ベクタを、ストア提出CIが
// Apple に送る前に検出する。`node scripts/lint-pre-submission.mjs` で手動実行、
// または CI(ios/android release の前段)で走らせる。
//
// 各チェックは独立。すべての失敗を集めて、blocking が1つでもあれば exit 1。
// warning(非 blocking)は表示するが exit は止めない。
//
// ガイドライン別の背景は _docs/apple-reject-knowledge-base.md を参照。
//
// 環境変数(アプリのレイアウトに合わせて上書き可能。未指定なら既定パスを探す):
//   APP_SIGNIN_GLOB        ログイン関連 source(既定: client/src/**, src/**)
//   APP_RELEASE_WORKFLOW   iOS release workflow(既定: .github/workflows/ios-appstore-release.yml)
//   APP_PLAY_WORKFLOW      Android release workflow(既定: .github/workflows/android-play-release.yml)
//   APP_PLATFORM_SCAN_DIRS 2.3.10 platform 参照を grep するディレクトリ(カンマ区切り、既定: store-assets,release-notes)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ANSI_RED = '\x1b[31m';
const ANSI_YELLOW = '\x1b[33m';
const ANSI_GREEN = '\x1b[32m';
const ANSI_DIM = '\x1b[2m';
const ANSI_RESET = '\x1b[0m';

const failures = [];
const warnings = [];

function fail(name, guideline, message) {
  failures.push({ name, guideline, message });
}
function warn(name, guideline, message) {
  warnings.push({ name, guideline, message });
}
function ok(name, detail) {
  console.log(`${ANSI_GREEN}✓${ANSI_RESET} ${name}${detail ? `  ${ANSI_DIM}${detail}${ANSI_RESET}` : ''}`);
}
function skip(name, why) {
  console.log(`${ANSI_DIM}- ${name} (skip: ${why})${ANSI_RESET}`);
}

function readFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}
function readJson(rel) {
  const c = readFile(rel);
  return c ? JSON.parse(c) : null;
}
function* walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkDir(full);
    else yield full;
  }
}

const appConfig = readJson('app.config.json');
const pkg = readJson('package.json');

/**
 * ネイティブ側の appId(bundle identifier)を取り出す。
 *
 * ★kimitolink-linktree から逆輸入(2026-08-08)。あちらは実体が `capacitor.config.ts`
 *   なのに `.json` 決め打ちで読んでいたため cap が常に null になり、
 *   **CHECK 2 が skip 表示すら出さずに丸ごと消滅**していた(linktree 46b0b66 / 7ffab0d)。
 *   このリポは現時点で `.json` なので同じ症状は出ていないが、
 *   (a) Expo prebuild へ移行済みで capacitor.config.json は将来消える可能性がある
 *   (b) `.ts` 化されたら同じ穴に落ちる
 *   ため、先に塞いでおく。ゲートは「見ていないこと」が見えなくなるのが最も危険。
 */
function readNativeAppId() {
  const capJson = readJson('capacitor.config.json');
  if (capJson) return { appId: capJson.appId ?? null, source: 'capacitor.config.json' };

  const capTs = readFile('capacitor.config.ts');
  if (capTs != null) {
    // ★コメントを除いてから**トップレベル**の appId だけを拾う(linktree 46b0b66)。
    //   素朴に match(/appId:.../) すると最初の1件しか見ないため、
    //   「旧IDをコメントで残す」「plugins の中に appId を持つプラグインがある」という
    //   ごく普通の編集で誤った値を拾う。誤一致で緑になると出荷ゲートが素通りする。
    const noComment = capTs
      .replace(/\/\*[\s\S]*?\*\//g, '')        // ブロックコメント
      .replace(/(^|[^:])\/\/.*$/gm, '$1');     // 行コメント(URL の // を壊さない)
    // 行頭インデント2以下＝トップレベル定義に限定(ネストしたプラグイン設定を拾わない)。
    const m = noComment.match(/^\s{0,2}appId:\s*['"`]([^'"`]+)['"`]/m);
    return { appId: m ? m[1] : null, source: 'capacitor.config.ts' };
  }

  // Expo prebuild 構成のフォールバック。app.config.ts は env 経由で
  // app.config.json の値を読むので、リテラルが取れないこともある(その場合は null)。
  const expoTs = readFile('app.config.ts');
  if (expoTs != null) {
    const noComment = expoTs
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    const m = noComment.match(/bundleIdentifier:\s*['"`]([^'"`]+)['"`]/);
    return { appId: m ? m[1] : null, source: 'app.config.ts' };
  }
  return null;
}

const cap = readNativeAppId();

// ----------------------------------------------------------------------------
// CHECK 1 — version が semver X.Y.Z(meta)
// ----------------------------------------------------------------------------
const marketingVersion = appConfig?.stores?.marketingVersion || pkg?.version;
if (!marketingVersion) {
  warn('version-present', 'meta', 'app.config.json stores.marketingVersion も package.json version も無い');
} else if (!/^\d+\.\d+\.\d+$/.test(String(marketingVersion))) {
  fail('version-semver', 'meta', `version "${marketingVersion}" が semver X.Y.Z でない`);
} else {
  ok('version-semver', `version = ${marketingVersion}`);
}

// ----------------------------------------------------------------------------
// CHECK 2 — Bundle ID 整合(capacitor.config.json appId == app.config bundleId)
// ----------------------------------------------------------------------------
const bundleId = appConfig?.identity?.bundleId;
// どの分岐に落ちても必ず ok/fail/skip のいずれかを出す(沈黙させない)。
// 以前は `else if (cap)` だったため、cap が null のとき **skip すら出ず
// チェックが丸ごと消滅**した。これは linktree が実際に踏んだ穴(7ffab0d)。
if (!cap) {
  skip('bundle-id-consistency', 'capacitor.config.json / .ts / app.config.ts のいずれも読めない');
} else if (!cap.appId) {
  skip('bundle-id-consistency', `${cap.source} から appId を読み取れない`);
} else if (!bundleId || String(bundleId).startsWith('<')) {
  skip('bundle-id-consistency', 'app.config identity.bundleId が未設定(プレースホルダのまま)');
} else if (cap.appId !== bundleId) {
  fail('bundle-id-consistency', 'meta', `${cap.source} appId="${cap.appId}" != app.config bundleId="${bundleId}"`);
} else {
  ok('bundle-id-consistency', cap.appId);
}

// ----------------------------------------------------------------------------
// CHECK 3 — 2.3.10 他プラットフォーム参照(Apple に送るメタデータに混入させない)
// ----------------------------------------------------------------------------
const banned = ['Android', 'Google Play', 'Play Store', 'Galaxy Store', 'Amazon Appstore', 'Material Design'];
const scanDirs = (process.env.APP_PLATFORM_SCAN_DIRS || 'store-assets/appstore,release-notes')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
let scannedAny = false;
let platformHit = false;
for (const dir of scanDirs) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  scannedAny = true;
  for (const f of walkDir(abs)) {
    if (!/\.(txt|md|json)$/i.test(f)) continue;
    const c = fs.readFileSync(f, 'utf8');
    const hits = banned.filter((w) => c.toLowerCase().includes(w.toLowerCase()));
    if (hits.length > 0) {
      platformHit = true;
      fail('platform-references', '2.3.10', `${path.relative(ROOT, f)}: ${hits.join(', ')}`);
    }
  }
}
if (!scannedAny) {
  skip('platform-references', `スキャン対象ディレクトリが無い (${scanDirs.join(', ')})`);
} else if (!platformHit) {
  ok('platform-references', `iOS メタデータに Android/Play 等の混入なし`);
}

// ----------------------------------------------------------------------------
// CHECK 4 — App Review 用 URL(app.config.json contact.*)
// ----------------------------------------------------------------------------
if (appConfig) {
  const urls = [
    ['supportUrl', appConfig.contact?.supportUrl],
    ['privacyUrl', appConfig.contact?.privacyUrl],
    ['marketingUrl', appConfig.contact?.marketingUrl],
  ];
  // dataDeletionUrl は「アカウント作成があるアプリ」のみ必須。businessModel から推定できないので warn。
  const dataDeletion = appConfig.contact?.dataDeletionUrl;
  const missing = urls.filter(([, v]) => !v || String(v).startsWith('<') || !/^https:\/\//.test(String(v)));
  if (missing.length > 0) {
    fail('app-config-review-urls', 'privacy/5.1.1(v)', `contact URL が未設定 or 非https: ${missing.map(([k]) => k).join(', ')}`);
  } else {
    ok('app-config-review-urls', 'support / privacy / marketing URL あり');
  }
  if (!dataDeletion || String(dataDeletion).startsWith('<')) {
    warn('account-deletion-url', '5.1.1(v)', 'contact.dataDeletionUrl 未設定。アカウント作成があるアプリは削除導線が必須(iOS16+)');
  } else if (/^https:\/\//.test(String(dataDeletion))) {
    ok('account-deletion-url', 'dataDeletionUrl あり');
  }

  // ストアに登録する法務URLに、対応するルートが実在するかを確認する。
  //
  // 値の存在チェックだけでは不十分。2026-07-30 に、4本とも app/ にルートが無く
  // 404 画面が描画される状態のまま lint が全項目 ok を出していた。
  // vercel.json の catch-all rewrite により未定義パスも HTTP 200 を返すため、
  // curl による到達性確認でも検出できない。ルートファイルの実在で判定する。
  const routeChecks = [
    ['privacyUrl', appConfig.contact?.privacyUrl],
    ['termsUrl', appConfig.contact?.termsUrl],
    ['supportUrl', appConfig.contact?.supportUrl],
    ['dataDeletionUrl', dataDeletion],
  ];
  const missingRoutes = [];
  for (const [key, url] of routeChecks) {
    if (!url || String(url).startsWith('<')) continue;
    let pathname;
    try {
      pathname = new URL(String(url)).pathname.replace(/^\/+|\/+$/g, '');
    } catch {
      continue;
    }
    if (!pathname) continue;
    // 自サイト内のパスのみ検査する（外部ホスティングなら対象外）
    const candidates = [
      `app/${pathname}.tsx`,
      `app/${pathname}/index.tsx`,
      `public/${pathname}.html`,
      `public/${pathname}/index.html`,
    ];
    if (!candidates.some((rel) => fs.existsSync(path.join(ROOT, rel)))) {
      missingRoutes.push(`${key}=/${pathname}`);
    }
  }
  if (missingRoutes.length > 0) {
    fail(
      'legal-routes-exist',
      'metadata/5.1.1',
      `ストアに登録する法務URLに対応するルートが実在しない: ${missingRoutes.join(', ')}。` +
        `catch-all rewrite があるため HTTP 200 でも中身は 404 画面になる`,
    );
  } else {
    ok('legal-routes-exist', 'privacy/terms/support/deletion のルートが実在');
  }
} else {
  skip('app-config-review-urls', 'app.config.json が無い');
}

// ----------------------------------------------------------------------------
// CHECK 5 — 2.3.3 スクショ capture は「ログイン後」を撮る(ログイン認証アプリのみ)
// v1.0.7: capture が未認証 /sign-in を撮り 2.3.3 却下。fail-closed を固定する。
// ログイン不要アプリは IOS_REVIEW_DEMO_* を使わないので skip 扱い。
// ----------------------------------------------------------------------------
const captureScript = readFile('scripts/capture-appstore-screenshots.mjs');
if (!captureScript) {
  warn('screenshot-capture-script', '2.3.3', 'scripts/capture-appstore-screenshots.mjs が無い(committed スクショ運用なら可)');
} else {
  const usesDemo = captureScript.includes('IOS_REVIEW_DEMO_USERNAME') && captureScript.includes('IOS_REVIEW_DEMO_PASSWORD');
  const failsClosed = /process\.exit\(1\)/.test(captureScript);
  if (!usesDemo) {
    // ログイン不要アプリ(public 画面のみで価値が伝わる)では正当。warn に留める。
    warn(
      'screenshot-capture-auth',
      '2.3.3',
      'capture が IOS_REVIEW_DEMO_USERNAME/_PASSWORD を読まない。ログイン認証アプリなら ' +
        'ログイン後画面を撮らないと v1.0.7 と同じ 2.3.3 却下になる。ログイン不要アプリなら無視可。',
    );
  } else if (!failsClosed) {
    fail('screenshot-capture-failclosed', '2.3.3', 'creds 欠落時に process.exit(1) しない。silent fallback は 2.3.3 を再発させる');
  } else {
    ok('screenshot-capture-auth', 'capture はログインして fail-closed');
  }
}

// ----------------------------------------------------------------------------
// CHECK 6 — 2.3.3 スクショ upload は delete-then-reupload(slot 内の stale を残さない)
// v1.0.8: filename 一致で skip した結果、slot1 に旧ログイン画面が残り再却下。
// ----------------------------------------------------------------------------
const ssUpload = readFile('scripts/lib/asc-screenshot-upload.mjs');
if (!ssUpload) {
  skip('screenshot-upload-delete-then-reupload', 'scripts/lib/asc-screenshot-upload.mjs が無い');
} else {
  const callsDelete = /deleteAllScreenshots\s*\(/.test(ssUpload);
  const hasDeleteApi = /['"]DELETE['"]/.test(ssUpload) && /appScreenshots\//.test(ssUpload);
  const hasFilenameSkip = /already uploaded; skipping/.test(ssUpload);
  if (!callsDelete || !hasDeleteApi) {
    fail(
      'screenshot-upload-delete-then-reupload',
      '2.3.3',
      `asc-screenshot-upload.mjs は再upload前に deleteAllScreenshots + DELETE /v1/appScreenshots/{id} を ` +
        `呼ぶこと(callsDelete=${callsDelete} hasDeleteApi=${hasDeleteApi})。ASC slot は versionString を跨いで persist する。`,
    );
  } else if (hasFilenameSkip) {
    warn('screenshot-upload-stale-skip', '2.3.3', '"already uploaded; skipping" の legacy dedup 文字列が残っている。到達不能か確認');
    ok('screenshot-upload-delete-then-reupload', 'delete-then-reupload あり(warn: legacy 文字列残存)');
  } else {
    ok('screenshot-upload-delete-then-reupload', 'delete-then-reupload あり');
  }
}

// ----------------------------------------------------------------------------
// CHECK 7 — release workflow の path filter が提出スクリプトを全て含む
// v1.0.8 retry#1: capture script が on.push.paths に無く、修正 push が silent no-op。
// ----------------------------------------------------------------------------
function checkWorkflowPaths(rel, requiredScripts, label) {
  const wf = readFile(rel);
  if (!wf) {
    skip(`${label}-workflow-paths`, `${rel} が無い`);
    return;
  }
  const m = wf.match(/\n {4}paths:\n([\s\S]*?)(?=\n[a-z][a-zA-Z_-]*:)/);
  const block = m ? m[1] : '';
  if (!block) {
    // path filter 無し = 全 push でトリガ(または別 on トリガ)。warn に留める。
    warn(`${label}-workflow-paths`, 'process', `${rel} に on.push.paths が無い。提出スクリプト修正が再ビルドをトリガするか確認`);
    return;
  }
  // workflow が実際に実行している script のみ必須化(invoke していないものは false flag しない)。
  const required = requiredScripts.filter((s) => wf.includes(`scripts/${s}`));
  const missing = required.filter((s) => !block.includes(`scripts/${s}`));
  if (missing.length > 0) {
    fail(`${label}-workflow-paths`, 'process', `${rel} の on.push.paths に提出スクリプトが欠落: ${missing.join(', ')}(修正 push が再トリガしない)`);
  } else if (required.length > 0) {
    ok(`${label}-workflow-paths`, `${required.length} scripts が path filter に存在`);
  } else {
    skip(`${label}-workflow-paths`, 'workflow が該当スクリプトを invoke していない');
  }
}
checkWorkflowPaths(
  process.env.APP_RELEASE_WORKFLOW || '.github/workflows/ios-appstore-release.yml',
  ['appstore-submit.mjs', 'capture-appstore-screenshots.mjs', 'frame-appstore-screenshots.mjs', 'lib/asc-api.mjs', 'lib/asc-screenshot-upload.mjs'],
  'ios',
);
checkWorkflowPaths(
  process.env.APP_PLAY_WORKFLOW || '.github/workflows/android-play-release.yml',
  ['play-publish.mjs', 'play-fill-listing.mjs', 'play-fill-data-safety.mjs', 'capture-play-screenshots.mjs', 'lib/play-api.mjs'],
  'android',
);

// ----------------------------------------------------------------------------
// CHECK 8 — Play スクショ capture も fail-closed(CHECK 5 の Play 版)
// ----------------------------------------------------------------------------
const playCapture = readFile('scripts/capture-play-screenshots.mjs');
if (!playCapture) {
  skip('play-capture-auth', 'scripts/capture-play-screenshots.mjs が無い');
} else {
  const usesDemo = playCapture.includes('IOS_REVIEW_DEMO_USERNAME') && playCapture.includes('IOS_REVIEW_DEMO_PASSWORD');
  const failsClosed = /process\.exit\(1\)/.test(playCapture);
  if (!usesDemo) {
    warn('play-capture-auth', '2.3.3', 'Play capture が demo creds を読まない。ログイン認証アプリならログイン後を撮ること');
  } else if (!failsClosed) {
    fail('play-capture-failclosed', '2.3.3', 'Play capture も creds 欠落時 exit 1 すること');
  } else {
    ok('play-capture-auth', 'Play capture はログインして fail-closed');
  }
}

// ----------------------------------------------------------------------------
// Output
// ----------------------------------------------------------------------------
console.log('');
if (warnings.length > 0) {
  console.log(`${ANSI_YELLOW}--- Warnings (${warnings.length}) ---${ANSI_RESET}`);
  for (const w of warnings) console.log(`${ANSI_YELLOW}!${ANSI_RESET} ${w.name} [${w.guideline}]: ${w.message}`);
  console.log('');
}
if (failures.length > 0) {
  console.log(`${ANSI_RED}--- Failures (${failures.length}) ---${ANSI_RESET}`);
  for (const f of failures) console.log(`${ANSI_RED}✗${ANSI_RESET} ${f.name} [${f.guideline}]: ${f.message}`);
  console.log('');
  console.log(`${ANSI_RED}Pre-submission lint failed.${ANSI_RESET}`);
  console.log('修正レシピは _docs/apple-reject-knowledge-base.md を参照。');
  process.exit(1);
}
console.log(`${ANSI_GREEN}All pre-submission lint checks passed.${ANSI_RESET}`);
console.log('ストア提出に進んで安全。');
